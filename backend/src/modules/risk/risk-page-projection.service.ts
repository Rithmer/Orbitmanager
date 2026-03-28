import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  IRiskAssessmentService,
  TaskRiskInput,
  TaskRiskOutput,
} from '@/domain/services/risk-assessment.interface';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';
import { MlClientService } from './ml-client.service';
import { RiskAssigneeScoringService } from './risk-assignee-scoring.service';
import type {
  ProjectMemberRecord,
  RiskPageContext,
  TaskRecord,
} from './risk-page-read-model.service';
import type {
  RiskFactorDto,
  RiskPageProjectDto,
  RiskPageTaskDto,
  RecommendationDto,
  TaskInsightDto,
} from './dto/risk-page.types';

@Injectable()
export class RiskPageProjectionService {
  private readonly provider: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly mlClient: MlClientService,
    @Inject(RISK_ASSESSMENT_SERVICE)
    private readonly riskService: IRiskAssessmentService,
    private readonly scoringService: RiskAssigneeScoringService,
  ) {
    this.provider = this.configService.get<string>('RISK_PROVIDER') ?? 'stub';
  }

  async buildProjectsPage(
    context: RiskPageContext,
  ): Promise<Record<number, RiskPageProjectDto>> {
    const predictionsByTaskId = await this.getPredictions(context.allInputs);
    const result: Record<number, RiskPageProjectDto> = {};

    for (const projectId of context.projectIds) {
      const tasks = context.tasksByProject.get(projectId) ?? [];
      const members = context.membersByProject.get(projectId) ?? [];

      if (tasks.length === 0) {
        result[projectId] = this.emptyProjectDto();
        continue;
      }

      const activeTaskCountByUser = this.buildActiveTaskCountByUser(tasks);

      const taskInsights: TaskInsightDto[] = [];
      const tasksAtRisk: RiskPageProjectDto['tasksAtRisk'] = [];
      let totalDelay = 0;

      for (const task of tasks) {
        const prediction = predictionsByTaskId.get(task.id);
        if (!prediction) continue;

        const input = context.inputsByTaskId.get(task.id);
        const insight = this.buildTaskInsight(
          task,
          prediction,
          input,
          members,
          activeTaskCountByUser,
        );
        taskInsights.push(insight);

        totalDelay += prediction.delayProbability;
        if (prediction.delayProbability > 0.3) {
          tasksAtRisk.push({
            taskId: task.id,
            taskName: task.name,
            delayProbability: prediction.delayProbability,
          });
        }
      }

      tasksAtRisk.sort((a, b) => b.delayProbability - a.delayProbability);

      const avgDelay = tasks.length > 0 ? totalDelay / tasks.length : 0;
      const riskScore = Math.round(avgDelay * 100);
      const riskLevel: 'low' | 'medium' | 'high' =
        avgDelay > 0.6 ? 'high' : avgDelay > 0.3 ? 'medium' : 'low';
      const successProbability = clamp(100 - riskScore, 0, 100);

      const riskFactors = this.collectProjectRiskFactors(
        taskInsights,
        predictionsByTaskId,
      );
      const recommendations = this.generateRecommendations(
        taskInsights,
        predictionsByTaskId,
      );

      const highRiskCount = tasksAtRisk.filter(
        (t) => t.delayProbability > 0.6,
      ).length;

      result[projectId] = {
        riskScore,
        riskLevel,
        tasksAtRisk,
        summary: this.buildSummary(
          riskLevel,
          riskScore,
          tasks.length,
          tasksAtRisk.length,
          highRiskCount,
        ),
        predictionSource: this.provider === 'ml' ? 'ml' : 'stub',
        successProbability,
        riskFactors,
        taskInsights,
        recommendations,
      };
    }

    return result;
  }

  async buildTasksPage(
    context: RiskPageContext,
    projectId: number,
  ): Promise<Record<number, RiskPageTaskDto>> {
    const tasks = context.tasksByProject.get(projectId) ?? [];
    if (tasks.length === 0) return {};

    const inputs = tasks
      .map((t) => context.inputsByTaskId.get(t.id))
      .filter((i): i is TaskRiskInput => i !== undefined);

    const predictionsByTaskId = await this.getPredictions(inputs);
    const members = context.membersByProject.get(projectId) ?? [];
    const activeTaskCountByUser = this.buildActiveTaskCountByUser(tasks);

    const result: Record<number, RiskPageTaskDto> = {};

    for (const task of tasks) {
      const prediction = predictionsByTaskId.get(task.id);
      if (!prediction) continue;

      const input = context.inputsByTaskId.get(task.id);
      const insight = this.buildTaskInsight(
        task,
        prediction,
        input,
        members,
        activeTaskCountByUser,
      );

      result[task.id] = {
        predictedCompletionDate: prediction.predictedCompletionDate,
        delayProbability: prediction.delayProbability,
        riskLevel: prediction.riskLevel,
        riskFactors: prediction.riskFactors,
        recommendation: prediction.recommendation,
        taskSuccessProbability: insight.taskSuccessProbability,
        coordinationPenalty: insight.coordinationPenalty,
        assigneeBreakdown: insight.assigneeBreakdown,
        recommendedAssignees: insight.recommendedAssignees,
      };
    }

    return result;
  }

  private async getPredictions(
    inputs: TaskRiskInput[],
  ): Promise<Map<number, TaskRiskOutput>> {
    if (inputs.length === 0) return new Map();

    if (this.provider === 'ml') {
      const mlResults = await this.mlClient.predictBatch(inputs);
      if (!mlResults) {
        throw new ServiceUnavailableException({
          code: 'RISK_ML_UNAVAILABLE',
          message: 'ML-сервис оценки рисков недоступен. Попробуйте позже.',
        });
      }

      const map = new Map<number, TaskRiskOutput>();
      for (const input of inputs) {
        const raw = mlResults[String(input.taskId)];
        if (raw) {
          map.set(input.taskId, {
            predictedCompletionDate: raw.predictedCompletionDate,
            delayProbability: raw.delayProbability,
            riskLevel: raw.riskLevel as 'low' | 'medium' | 'high',
            riskFactors: raw.riskFactors,
            recommendation: raw.recommendation,
          });
        }
      }
      return map;
    }

    // Stub path: use the injected risk service (stub) for each task
    const map = new Map<number, TaskRiskOutput>();
    for (const input of inputs) {
      const output = await this.riskService.assessTask(input);
      map.set(input.taskId, output);
    }
    return map;
  }

  private buildTaskInsight(
    task: TaskRecord,
    prediction: TaskRiskOutput,
    input: TaskRiskInput | undefined,
    members: ProjectMemberRecord[],
    activeTaskCountByUser: Map<number, number>,
  ): TaskInsightDto {
    const delayPercent = clamp(
      Math.round(prediction.delayProbability * 100),
      0,
      100,
    );
    const taskSuccessProbability = clamp(100 - delayPercent, 0, 100);

    const assigneeCount = input?.assigneeCount ?? task.assigneeIds.length;
    const statusChangesCount = input?.statusChangesCount ?? 0;
    const avgLoad =
      task.assigneeIds.length > 0
        ? task.assigneeIds.reduce(
            (sum, uid) => sum + (activeTaskCountByUser.get(uid) ?? 0),
            0,
          ) / task.assigneeIds.length
        : 0;

    const coordinationWeight = Math.min(
      0.85,
      0.2 +
        0.1 * Math.max(0, assigneeCount - 1) +
        0.05 * Math.min(3, statusChangesCount) +
        0.05 * Math.min(4, avgLoad),
    );
    const coordinationPenalty = clamp(
      Math.round(delayPercent * coordinationWeight),
      0,
      100,
    );

    const assigneeBreakdown = this.scoringService.buildAssigneeBreakdown(
      task,
      prediction,
      members,
      activeTaskCountByUser,
    );

    const recommendedAssignees = this.scoringService.buildRecommendedAssignees(
      task,
      prediction,
      members,
      activeTaskCountByUser,
    );

    return {
      taskId: task.id,
      taskName: task.name,
      predictedCompletionDate: prediction.predictedCompletionDate,
      delayProbability: prediction.delayProbability,
      riskLevel: prediction.riskLevel,
      riskFactors: prediction.riskFactors,
      recommendation: prediction.recommendation,
      taskSuccessProbability,
      coordinationPenalty,
      assigneeBreakdown,
      recommendedAssignees,
    };
  }

  private collectProjectRiskFactors(
    taskInsights: TaskInsightDto[],
    predictionsByTaskId: Map<number, TaskRiskOutput>,
  ): RiskFactorDto[] {
    const factorCounts = new Map<
      string,
      { label: string; severity: 'low' | 'medium' | 'high'; count: number }
    >();

    for (const insight of taskInsights) {
      const prediction = predictionsByTaskId.get(insight.taskId);
      if (!prediction) continue;

      for (const factor of prediction.riskFactors) {
        const existing = factorCounts.get(factor);
        const severity = this.inferSeverity(factor, prediction.riskLevel);
        if (existing) {
          existing.count++;
          if (severityRank(severity) > severityRank(existing.severity)) {
            existing.severity = severity;
          }
        } else {
          factorCounts.set(factor, { label: factor, severity, count: 1 });
        }
      }
    }

    return Array.from(factorCounts.entries())
      .sort((a, b) => {
        const sRank = severityRank(b[1].severity) - severityRank(a[1].severity);
        if (sRank !== 0) return sRank;
        return b[1].count - a[1].count;
      })
      .slice(0, 5)
      .map(([, val], index) => ({
        id: `factor-${index}`,
        label: val.label,
        severity: val.severity,
      }));
  }

  private inferSeverity(
    factorText: string,
    taskRiskLevel: 'low' | 'medium' | 'high',
  ): 'low' | 'medium' | 'high' {
    const lower = factorText.toLowerCase();
    if (
      lower.includes('высок') ||
      lower.includes('крит') ||
      lower.includes('high')
    )
      return 'high';
    if (lower.includes('низк') || lower.includes('low')) return 'low';
    if (taskRiskLevel === 'high') return 'high';
    if (taskRiskLevel === 'medium') return 'medium';
    return 'medium';
  }

  private generateRecommendations(
    taskInsights: TaskInsightDto[],
    predictionsByTaskId: Map<number, TaskRiskOutput>,
  ): RecommendationDto[] {
    const recommendations: RecommendationDto[] = [];
    let recIndex = 0;

    for (const insight of taskInsights) {
      if (insight.delayProbability <= 0.3) continue;

      const prediction = predictionsByTaskId.get(insight.taskId);
      if (!prediction) continue;

      const isUnassigned = insight.assigneeBreakdown.length === 0;
      const riskFactorsLower = prediction.riskFactors.map((f) =>
        f.toLowerCase(),
      );
      const hasHighLoad = riskFactorsLower.some(
        (f) => f.includes('нагрузк') || f.includes('load'),
      );

      // add_member: unassigned or high load with top candidate not current assignee
      if (isUnassigned || hasHighLoad) {
        const topCandidate = insight.recommendedAssignees[0];
        const isTopAlreadyAssigned = topCandidate
          ? insight.assigneeBreakdown.some(
              (a) => a.userId === topCandidate.userId,
            )
          : true;

        if (!isTopAlreadyAssigned || isUnassigned) {
          recommendations.push({
            id: `rec-${recIndex++}`,
            type: 'add_member',
            title: `Добавить исполнителя в задачу «${insight.taskName}»`,
            reason: isUnassigned
              ? 'Задача без исполнителей — рекомендуется назначить ответственного.'
              : 'Высокая нагрузка на текущих исполнителей — рассмотрите подключение дополнительного участника.',
            taskId: insight.taskId,
          });
          continue;
        }
      }

      // swap_members: current assignee has negative fitScore, candidate has >= 0.20
      const negativeAssignees = insight.assigneeBreakdown.filter(
        (a) => a.impactScore < 0,
      );
      const goodCandidate = insight.recommendedAssignees.find(
        (c) =>
          c.fitScore >= 0.2 &&
          !insight.assigneeBreakdown.some((a) => a.userId === c.userId),
      );

      if (negativeAssignees.length > 0 && goodCandidate) {
        recommendations.push({
          id: `rec-${recIndex++}`,
          type: 'swap_members',
          title: `Перераспределить исполнителей для задачи «${insight.taskName}»`,
          reason: `${negativeAssignees[0].userName} снижает шанс выполнения. ${goodCandidate.fullName} — более подходящий кандидат.`,
          taskId: insight.taskId,
        });
        continue;
      }

      // rebalance_load: multiple overloaded assignees
      if (negativeAssignees.length >= 2) {
        recommendations.push({
          id: `rec-${recIndex++}`,
          type: 'rebalance_load',
          title: `Перебалансировать нагрузку по задаче «${insight.taskName}»`,
          reason:
            'Несколько исполнителей с высокой нагрузкой — рекомендуется перераспределить задачи.',
          taskId: insight.taskId,
        });
      }
    }

    return recommendations;
  }

  private buildActiveTaskCountByUser(tasks: TaskRecord[]): Map<number, number> {
    const counts = new Map<number, number>();
    for (const task of tasks) {
      for (const uid of task.assigneeIds) {
        counts.set(uid, (counts.get(uid) ?? 0) + 1);
      }
    }
    return counts;
  }

  private emptyProjectDto(): RiskPageProjectDto {
    return {
      riskScore: 0,
      riskLevel: 'low',
      tasksAtRisk: [],
      summary: 'В проекте нет активных задач. Риски отсутствуют.',
      predictionSource: this.provider === 'ml' ? 'ml' : 'stub',
      successProbability: 100,
      riskFactors: [],
      taskInsights: [],
      recommendations: [],
    };
  }

  private buildSummary(
    riskLevel: 'low' | 'medium' | 'high',
    riskScore: number,
    totalActive: number,
    atRiskCount: number,
    highRiskCount: number,
  ): string {
    if (riskLevel === 'low') {
      return `Проект в зелёной зоне (${riskScore}/100). Из ${totalActive} активных задач нет задач с высоким риском.`;
    }
    if (riskLevel === 'medium') {
      return `Проект имеет средний уровень риска (${riskScore}/100). ${atRiskCount} из ${totalActive} активных задач требуют внимания.`;
    }
    return `Проект имеет высокий риск срыва сроков (${riskScore}/100): ${highRiskCount} задач с вероятностью задержки > 60%.`;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function severityRank(s: 'low' | 'medium' | 'high'): number {
  return s === 'high' ? 3 : s === 'medium' ? 2 : 1;
}
