import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { InMemoryCacheService } from '@/common/cache/in-memory-cache.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';
import type { IRiskAssessmentService } from '@/domain/services/risk-assessment.interface';
import type { Task } from '@/domain/models/task.model';
import { buildTaskRiskInput } from '../risk/helpers/build-task-risk-input';
import {
  DashboardRecentTaskItemDto,
  DashboardRiskInsightDto,
  DashboardSummaryResponseDto,
} from './dto/dashboard-summary-response.dto';

const DASHBOARD_RECENT_TASK_LIMIT = 6;
const DASHBOARD_RISK_INSIGHT_LIMIT = 5;
const DASHBOARD_CACHE_TTL_MS = 30_000;

interface DashboardTaskRow {
  id: number;
  projectId: number;
  name: string;
  description: string;
  deadline: Date;
  status: string;
  difficulty: number;
  assigneeId: number | null;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  project: {
    name: string;
  };
  assignee: {
    fullName: string;
  } | null;
}

interface DashboardActiveTaskRow {
  id: number;
  projectId: number;
  name: string;
  description: string;
  deadline: Date;
  status: string;
  difficulty: number;
  assigneeId: number | null;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  project: {
    name: string;
  };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: InMemoryCacheService,
    private readonly projectAccessService: ProjectAccessService,
    @Inject(RISK_ASSESSMENT_SERVICE)
    private readonly riskAssessmentService: IRiskAssessmentService,
  ) {}

  async getSummary(
    userId: number,
    accountRole: AccountRole,
  ): Promise<DashboardSummaryResponseDto> {
    const cacheKey = `dashboard:summary:${userId}:${accountRole}`;

    return this.cache.remember(
      cacheKey,
      async () => this.buildSummary(userId, accountRole),
      { ttlMs: DASHBOARD_CACHE_TTL_MS },
    );
  }

  private async buildSummary(
    userId: number,
    accountRole: AccountRole,
  ): Promise<DashboardSummaryResponseDto> {
    const visibleProjectIds = await this.getVisibleProjectIds(userId, accountRole);

    if (visibleProjectIds.length === 0) {
      return {
        overview: {
          doneTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          totalTasks: 0,
          progressPercent: 0,
          projectCount: 0,
        },
        recentTasks: [],
        riskInsights: [],
      };
    }

    const [
      projectCount,
      totalTasks,
      doneTasks,
      inProgressTasks,
      overdueTasks,
      recentTaskRows,
      activeTaskRows,
    ] = await Promise.all([
      this.prisma.project.count({
        where: { id: { in: visibleProjectIds } },
      }),
      this.prisma.task.count({
        where: { projectId: { in: visibleProjectIds } },
      }),
      this.prisma.task.count({
        where: {
          projectId: { in: visibleProjectIds },
          status: TaskStatus.DONE,
        },
      }),
      this.prisma.task.count({
        where: {
          projectId: { in: visibleProjectIds },
          status: TaskStatus.IN_PROGRESS,
        },
      }),
      this.prisma.task.count({
        where: {
          projectId: { in: visibleProjectIds },
          deadline: { lt: new Date() },
          status: {
            notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
          },
        },
      }),
      this.prisma.task.findMany({
        where: { projectId: { in: visibleProjectIds } },
        orderBy: { createdAt: 'desc' },
        take: DASHBOARD_RECENT_TASK_LIMIT,
        select: {
          id: true,
          projectId: true,
          name: true,
          description: true,
          deadline: true,
          status: true,
          difficulty: true,
          assigneeId: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              name: true,
            },
          },
          assignee: {
            select: {
              fullName: true,
            },
          },
        },
      }),
      this.prisma.task.findMany({
        where: {
          projectId: { in: visibleProjectIds },
          status: {
            notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
          },
        },
        orderBy: { deadline: 'asc' },
        select: {
          id: true,
          projectId: true,
          name: true,
          description: true,
          deadline: true,
          status: true,
          difficulty: true,
          assigneeId: true,
          createdById: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    const activeTaskIds = activeTaskRows.map((task) => task.id);
    const statusChangeLogs =
      activeTaskIds.length === 0
        ? []
        : await this.prisma.auditLog.findMany({
            where: {
              entityType: 'task',
              entityId: {
                in: activeTaskIds,
              },
              action: AuditAction.STATUS_CHANGE,
            },
            select: {
              entityId: true,
            },
          });

    const statusChangesByTaskId = new Map<number, number>();
    for (const log of statusChangeLogs) {
      if (log.entityId === null) {
        continue;
      }

      statusChangesByTaskId.set(
        log.entityId,
        (statusChangesByTaskId.get(log.entityId) ?? 0) + 1,
      );
    }

    const activeTasksByAssignee = new Map<number, number>();
    for (const task of activeTaskRows) {
      if (task.assigneeId === null) {
        continue;
      }

      activeTasksByAssignee.set(
        task.assigneeId,
        (activeTasksByAssignee.get(task.assigneeId) ?? 0) + 1,
      );
    }

    const riskInsights = (
      await Promise.all(
        activeTaskRows.map(async (taskRow) => {
          const task = this.toTaskDomain(taskRow);
          const statusChangesCount =
            statusChangesByTaskId.get(task.id) ?? 0;
          const assigneeLoad = task.assigneeId
            ? Math.max((activeTasksByAssignee.get(task.assigneeId) ?? 0) - 1, 0)
            : 0;
          const riskInput = buildTaskRiskInput(
            task,
            statusChangesCount,
            assigneeLoad,
          );
          const risk = await this.riskAssessmentService.assessTask(riskInput);

          return {
            taskRow,
            risk,
          };
        }),
      )
    )
      .filter(({ risk }) => risk.delayProbability > 0.3)
      .sort((left, right) => right.risk.delayProbability - left.risk.delayProbability)
      .slice(0, DASHBOARD_RISK_INSIGHT_LIMIT)
      .map(({ taskRow, risk }) => this.toRiskInsight(taskRow, risk));

    return {
      overview: {
        doneTasks,
        inProgressTasks,
        overdueTasks,
        totalTasks,
        progressPercent:
          totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        projectCount,
      },
      recentTasks: recentTaskRows.map((taskRow) => this.toRecentTask(taskRow)),
      riskInsights,
    };
  }

  private async getVisibleProjectIds(
    userId: number,
    accountRole: AccountRole,
  ): Promise<number[]> {
    if (accountRole === AccountRole.ADMIN) {
      const projects = await this.prisma.project.findMany({
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      return projects.map((project) => project.id);
    }

    return this.projectAccessService.getVisibleProjectIds(userId);
  }

  private toTaskDomain(row: DashboardActiveTaskRow): Task {
    return {
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      description: row.description,
      deadline: row.deadline.toISOString(),
      status: row.status as Task['status'],
      difficulty: row.difficulty,
      assigneeId: row.assigneeId,
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toRecentTask(row: DashboardTaskRow): DashboardRecentTaskItemDto {
    const status = row.status as TaskStatus;
    return {
      id: row.id,
      projectId: row.projectId,
      projectName: row.project.name,
      name: row.name,
      status,
      statusLabel: this.getStatusLabel(status),
      deadline: row.deadline.toISOString(),
      assigneeName: row.assignee?.fullName ?? null,
      isOverdue:
        row.deadline.getTime() < Date.now() &&
        status !== TaskStatus.DONE &&
        status !== TaskStatus.CANCELLED,
    };
  }

  private toRiskInsight(
    row: DashboardActiveTaskRow,
    risk: Awaited<ReturnType<IRiskAssessmentService['assessTask']>>,
  ): DashboardRiskInsightDto {
    const type =
      risk.delayProbability > 0.6
        ? 'error'
        : risk.delayProbability > 0.3
          ? 'warning'
          : 'info';

    return {
      taskId: row.id,
      taskName: row.name,
      projectId: row.projectId,
      projectName: row.project.name,
      delayProbability: risk.delayProbability,
      riskLevel: risk.riskLevel as DashboardRiskInsightDto['riskLevel'],
      type,
      message: `Задача «${row.name}» в проекте «${row.project.name}» имеет вероятность задержки ${Math.round(risk.delayProbability * 100)}%`,
      recommendation: risk.recommendation,
    };
  }

  private getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.NEW:
        return 'Новая';
      case TaskStatus.IN_PROGRESS:
        return 'В процессе';
      case TaskStatus.REVIEW:
        return 'На проверке';
      case TaskStatus.DONE:
        return 'Выполнена';
      case TaskStatus.CANCELLED:
        return 'Отменена';
      default:
        return status;
    }
  }
}
