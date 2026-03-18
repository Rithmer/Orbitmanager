import { Inject, Injectable } from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { buildPaginatedResult, normalizePagination } from '@/common/query/pagination';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { buildOrderBy } from '@/infrastructure/repositories/prisma/prisma-query.utils';
import { RISK_ASSESSMENT_SERVICE, type IRiskAssessmentService } from '@/domain/services/risk-assessment.interface';
import type { ProjectRiskOutputDto, TaskRiskOutputDto } from '@/modules/risk/dto';
import { buildTaskRiskInput } from '@/modules/risk/helpers/build-task-risk-input';
import type {
  ProjectListViewItemDto,
  ProjectsListViewQueryParams,
  ProjectsListViewResponseDto,
} from './projects-list-view.types';

type ProjectRecord = {
  id: number;
  teamId: number;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  team: {
    id: number;
    name: string;
  };
  _count: {
    members: number;
  };
};

type TaskRecord = {
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
};

@Injectable()
export class ProjectsListViewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    @Inject(RISK_ASSESSMENT_SERVICE)
    private readonly riskService: IRiskAssessmentService,
  ) {}

  async getListView(
    params: ProjectsListViewQueryParams,
    userId: number,
    userRole: AccountRole,
  ): Promise<ProjectsListViewResponseDto> {
    const { page, limit, skip } = normalizePagination(params.page, params.limit);
    const search = params.search?.trim();
    const visibleProjectIds =
      userRole === AccountRole.ADMIN
        ? undefined
        : await this.projectAccessService.getVisibleProjectIds(userId);

    if (visibleProjectIds && visibleProjectIds.length === 0) {
      return buildPaginatedResult([], 0, page, limit);
    }

    const where = buildProjectsWhere(search, params.teamId, params.status, visibleProjectIds);

    const [records, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: buildOrderBy(
          params.sort,
          ['id', 'teamId', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
          'id',
        ),
        skip,
        take: limit,
        select: {
          id: true,
          teamId: true,
          name: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    if (records.length === 0) {
      return buildPaginatedResult([], total, page, limit);
    }

    const projectIds = records.map((record) => record.id);
    const tasks = await this.prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
      },
      orderBy: [{ projectId: 'asc' }, { id: 'asc' }],
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
      },
    });

    const auditLogs = await this.loadTaskStatusChanges(tasks.map((task) => task.id));

    const taskRisksByTaskId = await this.buildTaskRiskMap(tasks, auditLogs);
    const tasksByProjectId = groupTasksByProjectId(tasks);

    return buildPaginatedResult(
      records.map((record) =>
        this.toProjectListViewItem(
          record,
          tasksByProjectId.get(record.id) ?? [],
          taskRisksByTaskId,
        ),
      ),
      total,
      page,
      limit,
    );
  }

  private async loadTaskStatusChanges(
    taskIds: number[],
  ): Promise<Map<number, number>> {
    if (taskIds.length === 0) {
      return new Map<number, number>();
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'task',
        action: 'status_change',
        entityId: {
          in: taskIds,
        },
      },
      select: {
        entityId: true,
      },
    });

    const statusChangesByTaskId = new Map<number, number>();

    for (const auditLog of auditLogs) {
      if (auditLog.entityId === null) {
        continue;
      }

      statusChangesByTaskId.set(
        auditLog.entityId,
        (statusChangesByTaskId.get(auditLog.entityId) ?? 0) + 1,
      );
    }

    return statusChangesByTaskId;
  }

  private async buildTaskRiskMap(
    tasks: TaskRecord[],
    statusChangesByTaskId: Map<number, number>,
  ): Promise<Map<number, TaskRiskOutputDto>> {
    const activeTasks = tasks.filter((task) => isActiveTask(task.status));
    if (activeTasks.length === 0) {
      return new Map<number, TaskRiskOutputDto>();
    }

    const assigneeLoadByTaskId = buildAssigneeLoadMap(activeTasks);
    const entries = await Promise.all(
      activeTasks.map(async (task) => {
        const taskRisk = await this.riskService.assessTask(
          buildTaskRiskInput(
            {
              id: task.id,
              projectId: task.projectId,
              name: task.name,
              description: task.description,
              deadline: task.deadline.toISOString(),
              status: task.status as TaskStatus,
              difficulty: task.difficulty,
              assigneeId: task.assigneeId,
              createdById: task.createdById,
              createdAt: task.createdAt.toISOString(),
              updatedAt: task.updatedAt.toISOString(),
            },
            statusChangesByTaskId.get(task.id) ?? 0,
            assigneeLoadByTaskId.get(task.id) ?? 0,
          ),
        );

        return [task.id, taskRisk] as const;
      }),
    );

    return new Map(entries);
  }

  private toProjectListViewItem(
    record: ProjectRecord,
    tasks: TaskRecord[],
    taskRisksByTaskId: Map<number, TaskRiskOutputDto>,
  ): ProjectListViewItemDto {
    return {
      id: record.id,
      teamId: record.teamId,
      teamName: record.team.name,
      name: record.name,
      description: record.description,
      status: record.status as ProjectStatus,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      memberCount: record._count.members,
      riskSummary: buildProjectRiskSummary(tasks, taskRisksByTaskId),
    };
  }
}

function buildProjectsWhere(
  search: string | undefined,
  teamId: number | undefined,
  status: string | undefined,
  visibleProjectIds: number[] | undefined,
) {
  const conditions: Record<string, unknown>[] = [];

  if (search) {
    conditions.push({
      OR: [
        {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive' as const,
          },
        },
        {
          team: {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        },
        {
          team: {
            description: {
              contains: search,
              mode: 'insensitive' as const,
            },
          },
        },
      ],
    });
  }

  if (teamId !== undefined) {
    conditions.push({ teamId });
  }

  if (status) {
    conditions.push({ status });
  }

  if (visibleProjectIds) {
    conditions.push({ id: { in: visibleProjectIds } });
  }

  if (conditions.length === 0) {
    return {};
  }

  return {
    AND: conditions,
  };
}

function groupTasksByProjectId(tasks: TaskRecord[]): Map<number, TaskRecord[]> {
  const grouped = new Map<number, TaskRecord[]>();

  for (const task of tasks) {
    const projectTasks = grouped.get(task.projectId) ?? [];
    projectTasks.push(task);
    grouped.set(task.projectId, projectTasks);
  }

  return grouped;
}

function buildAssigneeLoadMap(tasks: TaskRecord[]): Map<number, number> {
  const activeCountsByAssignee = new Map<number, number>();

  for (const task of tasks) {
    if (task.assigneeId === null || !isActiveTask(task.status)) {
      continue;
    }

    activeCountsByAssignee.set(
      task.assigneeId,
      (activeCountsByAssignee.get(task.assigneeId) ?? 0) + 1,
    );
  }

  const assigneeLoadByTaskId = new Map<number, number>();

  for (const task of tasks) {
    if (task.assigneeId === null) {
      assigneeLoadByTaskId.set(task.id, 0);
      continue;
    }

    assigneeLoadByTaskId.set(
      task.id,
      Math.max(0, (activeCountsByAssignee.get(task.assigneeId) ?? 0) - 1),
    );
  }

  return assigneeLoadByTaskId;
}

function buildProjectRiskSummary(
  tasks: TaskRecord[],
  taskRisksByTaskId: Map<number, TaskRiskOutputDto>,
): ProjectRiskOutputDto {
  const activeTasks = tasks.filter((task) => isActiveTask(task.status));

  if (activeTasks.length === 0) {
    return {
      riskScore: 0,
      riskLevel: 'low',
      tasksAtRisk: [],
      summary: 'В проекте нет активных задач. Риски отсутствуют.',
    };
  }

  const tasksAtRisk: ProjectRiskOutputDto['tasksAtRisk'] = [];
  let totalDelay = 0;

  for (const task of activeTasks) {
    const taskRisk = taskRisksByTaskId.get(task.id);
    if (!taskRisk) {
      continue;
    }

    totalDelay += taskRisk.delayProbability;

    if (taskRisk.delayProbability > 0.3) {
      tasksAtRisk.push({
        taskId: task.id,
        taskName: task.name,
        delayProbability: taskRisk.delayProbability,
      });
    }
  }

  tasksAtRisk.sort((left, right) => right.delayProbability - left.delayProbability);

  const averageDelay = totalDelay / activeTasks.length;
  const riskScore = Math.round(averageDelay * 100);
  const riskLevel =
    averageDelay > 0.6 ? 'high' : averageDelay > 0.3 ? 'medium' : 'low';
  const highRiskCount = tasksAtRisk.filter(
    (task) => task.delayProbability > 0.6,
  ).length;

  return {
    riskScore,
    riskLevel,
    tasksAtRisk,
    summary: buildProjectSummaryText(
      riskLevel,
      riskScore,
      activeTasks.length,
      tasksAtRisk.length,
      highRiskCount,
    ),
  };
}

function buildProjectSummaryText(
  riskLevel: 'low' | 'medium' | 'high',
  riskScore: number,
  totalActiveTasks: number,
  tasksAtRiskCount: number,
  highRiskCount: number,
): string {
  if (riskLevel === 'low') {
    return `Проект находится в зеленой зоне (${riskScore}/100). Из ${totalActiveTasks} активных задач нет задач с высоким риском.`;
  }

  if (riskLevel === 'medium') {
    return `Проект имеет средний уровень риска (${riskScore}/100). ${tasksAtRiskCount} из ${totalActiveTasks} активных задач требуют внимания.`;
  }

  return `Проект имеет высокий риск срыва сроков (${riskScore}/100): ${highRiskCount} задач с вероятностью задержки выше 60%.`;
}

function isActiveTask(status: string): boolean {
  return status !== TaskStatus.DONE && status !== TaskStatus.CANCELLED;
}
