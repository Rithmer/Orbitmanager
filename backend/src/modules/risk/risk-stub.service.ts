import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type {
  IRiskAssessmentService,
  TaskRiskInput,
  TaskRiskOutput,
  ProjectRiskOutput,
} from '@/domain/services/risk-assessment.interface';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { IAuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { buildTaskRiskInput } from './helpers/build-task-risk-input';
import {
  RISK_THRESHOLD_AT_RISK,
  RISK_THRESHOLD_HIGH,
  getRiskLevel,
  buildProjectRiskSummary,
  EMPTY_PROJECT_SUMMARY,
} from './risk.constants';

@Injectable()
export class RiskStubService implements IRiskAssessmentService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  assessTask(input: TaskRiskInput): Promise<TaskRiskOutput> {
    const { delayProbability, riskFactors } = this.calculateTaskRisk(input);
    const riskLevel = getRiskLevel(delayProbability);

    const predictedCompletionDate = this.predictCompletionDate(input);
    const recommendation = this.generateRecommendation(riskFactors, riskLevel);

    return Promise.resolve({
      predictedCompletionDate,
      delayProbability: Math.round(delayProbability * 100) / 100,
      riskLevel,
      riskFactors,
      recommendation,
    });
  }

  async assessProject(projectId: number): Promise<ProjectRiskOutput> {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException(`Проект #${projectId} не найден`);
    }

    const tasks = await this.taskRepository.findByProject(projectId);
    const activeTasks = tasks.filter(
      (t) => t.status !== TaskStatus.DONE && t.status !== TaskStatus.CANCELLED,
    );

    if (activeTasks.length === 0) {
      return {
        riskScore: 0,
        riskLevel: 'low',
        tasksAtRisk: [],
        summary: EMPTY_PROJECT_SUMMARY,
      };
    }

    const taskIds = activeTasks.map((t) => t.id);
    const taskAuditLogs = await this.auditLogRepository.findByEntityIds(
      'task',
      taskIds,
    );

    const taskRisks: {
      taskId: number;
      taskName: string;
      delayProbability: number;
    }[] = [];
    let totalDelay = 0;

    for (const task of activeTasks) {
      const statusChangesCount = taskAuditLogs.filter(
        (l) => l.entityId === task.id && l.action === AuditAction.STATUS_CHANGE,
      ).length;

      const assigneeLoad =
        task.assigneeIds.length > 0
          ? Math.max(
              ...task.assigneeIds.map(
                (uid) =>
                  tasks.filter(
                    (t) =>
                      t.assigneeIds.includes(uid) &&
                      t.status !== TaskStatus.DONE &&
                      t.status !== TaskStatus.CANCELLED &&
                      t.id !== task.id,
                  ).length,
              ),
            )
          : 0;

      const input = buildTaskRiskInput(task, statusChangesCount, assigneeLoad);

      const { delayProbability } = this.calculateTaskRisk(input);
      totalDelay += delayProbability;

      if (delayProbability > RISK_THRESHOLD_AT_RISK) {
        taskRisks.push({
          taskId: task.id,
          taskName: task.name,
          delayProbability: Math.round(delayProbability * 100) / 100,
        });
      }
    }

    const avgDelay = totalDelay / activeTasks.length;
    const riskScore = Math.round(avgDelay * 100);
    const riskLevel = getRiskLevel(avgDelay);

    taskRisks.sort((a, b) => b.delayProbability - a.delayProbability);

    const highRiskCount = taskRisks.filter(
      (t) => t.delayProbability > RISK_THRESHOLD_HIGH,
    ).length;
    const summary = buildProjectRiskSummary(
      riskLevel,
      riskScore,
      activeTasks.length,
      taskRisks.length,
      highRiskCount,
    );

    return { riskScore, riskLevel, tasksAtRisk: taskRisks, summary };
  }

  private calculateTaskRisk(input: TaskRiskInput): {
    delayProbability: number;
    riskFactors: string[];
  } {
    const riskFactors: string[] = [];
    let delayProbability: number;

    if (input.daysUntilDeadline < 0) {
      delayProbability = 0.95;
      riskFactors.push('Дедлайн уже прошёл');
    } else if (
      input.daysUntilDeadline <= 2 &&
      input.status !== TaskStatus.REVIEW
    ) {
      delayProbability = 0.7;
      riskFactors.push('До дедлайна менее 2 дней, задача не на ревью');
    } else if (input.difficulty >= 4 && input.assigneeLoad > 5) {
      delayProbability = 0.6;
      riskFactors.push('Высокая сложность задачи');
      riskFactors.push('Высокая нагрузка на исполнителя (более 5 задач)');
    } else if (input.difficulty >= 3 && input.daysUntilDeadline <= 5) {
      delayProbability = 0.4;
      riskFactors.push('Средняя/высокая сложность при близком дедлайне');
    } else {
      delayProbability = 0.1 + input.difficulty * 0.05;
    }

    if (input.assigneeCount === 0) {
      riskFactors.push('Задача не назначена исполнителю');
    }
    if (input.statusChangesCount > 3) {
      riskFactors.push('Частые изменения статуса (возможная нестабильность)');
    }

    return { delayProbability: Math.min(delayProbability, 1.0), riskFactors };
  }

  private predictCompletionDate(input: TaskRiskInput): string {
    const deadline = new Date(input.deadline);
    const now = new Date();

    if (input.status === TaskStatus.DONE) {
      return now.toISOString();
    }

    const { delayProbability } = this.calculateTaskRisk(input);
    const totalDuration =
      deadline.getTime() - new Date(input.createdAt).getTime();
    const delayMs = totalDuration * delayProbability * 0.5;

    const predicted = new Date(deadline.getTime() + delayMs);
    return predicted < now ? now.toISOString() : predicted.toISOString();
  }

  private generateRecommendation(
    riskFactors: string[],
    riskLevel: 'low' | 'medium' | 'high',
  ): string {
    if (riskLevel === 'low') {
      return 'Задача находится в зелёной зоне. Продолжайте в текущем режиме.';
    }

    const recommendations: string[] = [];

    if (riskFactors.some((f) => f.includes('Дедлайн уже прошёл'))) {
      recommendations.push(
        'Необходимо срочно пересмотреть сроки или перераспределить ресурсы.',
      );
    }
    if (riskFactors.some((f) => f.includes('не на ревью'))) {
      recommendations.push(
        'Рекомендуется ускорить завершение задачи и передать на ревью.',
      );
    }
    if (riskFactors.some((f) => f.includes('нагрузка на исполнителя'))) {
      recommendations.push(
        'Рассмотрите возможность переназначения задачи или снижения нагрузки исполнителя.',
      );
    }
    if (riskFactors.some((f) => f.includes('не назначена'))) {
      recommendations.push('Назначьте исполнителя для задачи.');
    }
    if (riskFactors.some((f) => f.includes('близком дедлайне'))) {
      recommendations.push('Контролируйте ход выполнения задачи ежедневно.');
    }

    return recommendations.length > 0
      ? recommendations.join(' ')
      : 'Обратите внимание на факторы риска и при необходимости скорректируйте план.';
  }
}
