import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
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
import { MlClientService } from './ml-client.service';
import { RiskStubService } from './risk-stub.service';
import { buildTaskRiskInput } from './helpers/build-task-risk-input';
import {
  RISK_THRESHOLD_AT_RISK,
  RISK_THRESHOLD_HIGH,
  getRiskLevel,
  buildProjectRiskSummary,
  EMPTY_PROJECT_SUMMARY,
} from './risk.constants';

@Injectable()
export class RiskMlService implements IRiskAssessmentService {
  private readonly logger = new Logger(RiskMlService.name);

  constructor(
    private readonly mlClient: MlClientService,
    private readonly stubService: RiskStubService,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async assessTask(input: TaskRiskInput): Promise<TaskRiskOutput> {
    const mlResult = await this.mlClient.predict(input);

    if (mlResult) {
      return {
        predictedCompletionDate: mlResult.predictedCompletionDate,
        delayProbability: mlResult.delayProbability,
        riskLevel: mlResult.riskLevel as 'low' | 'medium' | 'high',
        riskFactors: mlResult.riskFactors,
        recommendation: mlResult.recommendation,
      };
    }

    this.logger.warn('ML service unavailable, falling back to stub');
    return this.stubService.assessTask(input);
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
    const auditLogs = await this.auditLogRepository.findByEntityIds(
      'task',
      taskIds,
    );

    const inputs: TaskRiskInput[] = activeTasks.map((task) => {
      const statusChangesCount = auditLogs.filter(
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

      return buildTaskRiskInput(task, statusChangesCount, assigneeLoad);
    });

    // Try batch prediction via ML service
    const mlResults = await this.mlClient.predictBatch(inputs);

    if (mlResults) {
      return this.buildProjectRiskFromResults(activeTasks, mlResults);
    }

    // Fallback to stub
    this.logger.warn(
      'ML service unavailable for assessProject, falling back to stub',
    );
    return this.stubService.assessProject(projectId);
  }

  private buildProjectRiskFromResults(
    activeTasks: { id: number; name: string; status: string }[],
    mlResults: Record<
      string,
      {
        delayProbability: number;
        riskLevel: string;
        riskFactors: string[];
        recommendation: string;
        predictedCompletionDate: string;
      }
    >,
  ): ProjectRiskOutput {
    const tasksAtRisk: ProjectRiskOutput['tasksAtRisk'] = [];
    let totalDelay = 0;

    for (const task of activeTasks) {
      const prediction = mlResults[String(task.id)];
      if (!prediction) continue;

      totalDelay += prediction.delayProbability;
      if (prediction.delayProbability > RISK_THRESHOLD_AT_RISK) {
        tasksAtRisk.push({
          taskId: task.id,
          taskName: task.name,
          delayProbability: prediction.delayProbability,
        });
      }
    }

    tasksAtRisk.sort((a, b) => b.delayProbability - a.delayProbability);

    const avgDelay =
      activeTasks.length > 0 ? totalDelay / activeTasks.length : 0;
    const riskScore = Math.round(avgDelay * 100);
    const riskLevel = getRiskLevel(avgDelay);

    const highRiskCount = tasksAtRisk.filter(
      (t) => t.delayProbability > RISK_THRESHOLD_HIGH,
    ).length;

    const summary = buildProjectRiskSummary(
      riskLevel,
      riskScore,
      activeTasks.length,
      tasksAtRisk.length,
      highRiskCount,
    );

    return { riskScore, riskLevel, tasksAtRisk, summary };
  }
}
