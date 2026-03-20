import { ForbiddenException, Injectable } from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { InMemoryCacheService } from '@/common/cache/in-memory-cache.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ReportsSummaryResponseDto } from './dto/reports-summary-response.dto';

const REPORTS_CACHE_TTL_MS = 60_000;

export interface ProjectNameRow {
  id: number;
  name: string;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: InMemoryCacheService,
  ) {}

  async getSummary(
    userId: number,
    accountRole: AccountRole,
    projectId?: number,
  ): Promise<ReportsSummaryResponseDto> {
    const cacheKey = `reports:summary:${userId}:${accountRole}:${
      projectId ?? 'all'
    }`;

    return this.cache.remember(
      cacheKey,
      async () => this.buildSummary(userId, accountRole, projectId),
      { ttlMs: REPORTS_CACHE_TTL_MS },
    );
  }

  private async buildSummary(
    userId: number,
    accountRole: AccountRole,
    projectId?: number,
  ): Promise<ReportsSummaryResponseDto> {
    const accessibleProjectIds = await this.getAccessibleProjectIds(
      userId,
      accountRole,
    );

    if (accessibleProjectIds.length === 0) {
      throw new ForbiddenException('Нет прав на аналитику');
    }

    const targetProjectIds =
      projectId !== undefined
        ? [projectId]
        : accessibleProjectIds;

    if (
      projectId !== undefined &&
      !accessibleProjectIds.includes(projectId)
    ) {
      throw new ForbiddenException('Нет прав на выбранный проект');
    }

    const where = {
      projectId: {
        in: targetProjectIds,
      },
    };

    const [
      totalTasks,
      doneTasks,
      inProgressTasks,
      newTasks,
      overdueTasks,
      projectTaskGroups,
      difficultyGroups,
    ] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({
        where: {
          ...where,
          status: TaskStatus.DONE,
        },
      }),
      this.prisma.task.count({
        where: {
          ...where,
          status: TaskStatus.IN_PROGRESS,
        },
      }),
      this.prisma.task.count({
        where: {
          ...where,
          status: TaskStatus.NEW,
        },
      }),
      this.prisma.task.count({
        where: {
          ...where,
          deadline: { lt: new Date() },
          status: {
            notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
          },
        },
      }),
      this.prisma.task.groupBy({
        by: ['projectId', 'status'],
        where,
        _count: {
          _all: true,
        },
      }),
      this.prisma.task.groupBy({
        by: ['difficulty'],
        where,
        _count: {
          _all: true,
        },
        orderBy: {
          difficulty: 'asc',
        },
      }),
    ]);

    const projectTaskSummary = new Map<number, { taskCount: number; completedTaskCount: number }>();
    for (const group of projectTaskGroups) {
      const summary =
        projectTaskSummary.get(group.projectId) ?? {
          taskCount: 0,
          completedTaskCount: 0,
        };

      summary.taskCount += group._count._all;
      if (group.status === TaskStatus.DONE) {
        summary.completedTaskCount += group._count._all;
      }

      projectTaskSummary.set(group.projectId, summary);
    }

    const topProjectEntries = [...projectTaskSummary.entries()]
      .sort((left, right) => right[1].taskCount - left[1].taskCount)
      .slice(0, 6);

    const topProjectIds = topProjectEntries.map(([projectId]) => projectId);
    const projectNames = await this.prisma.project.findMany({
      where: {
        id: {
          in: topProjectIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const projectNameById = new Map(
      projectNames.map((project: ProjectNameRow) => [project.id, project.name]),
    );

    const statusDistribution = [
      {
        label: 'Выполнено',
        value: doneTasks,
        color: '#10b981',
      },
      {
        label: 'В процессе',
        value: inProgressTasks,
        color: '#f59e0b',
      },
      {
        label: 'Запланировано',
        value: newTasks,
        color: '#4880ff',
      },
      {
        label: 'Просрочено',
        value: overdueTasks,
        color: '#ef4444',
      },
    ].filter((item) => item.value > 0);

    const projectTaskBreakdown = topProjectEntries.map(([projectId, summary]) => ({
      projectId,
      projectName: projectNameById.get(projectId) ?? `Проект #${projectId}`,
      taskCount: summary.taskCount,
      completedTaskCount: summary.completedTaskCount,
    }));

    const difficultyDistribution = [1, 2, 3, 4, 5].map((difficulty) => {
      const count =
        difficultyGroups.find((group) => group.difficulty === difficulty)?._count._all ?? 0;

      return {
        difficulty,
        label: `Сложность ${difficulty}`,
        value: count,
      };
    }).filter((item) => item.value > 0);

    return {
      overview: {
        doneTasks,
        inProgressTasks,
        newTasks,
        overdueTasks,
        totalTasks,
        efficiency: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        projectCount: targetProjectIds.length,
      },
      statusDistribution,
      projectTaskBreakdown,
      difficultyDistribution,
    };
  }

  async getAccessibleProjects(
    userId: number,
    accountRole: AccountRole,
  ): Promise<ProjectNameRow[]> {
    const projectIds = await this.getAccessibleProjectIds(userId, accountRole);

    if (projectIds.length === 0) {
      throw new ForbiddenException('Нет прав на аналитику');
    }

    return this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
  }

  private async getAccessibleProjectIds(
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

    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId },
      select: { teamId: true, teamRole: true },
    });

    const ownerTeamIds = [
      ...new Set(
        teamMemberships
          .filter((m) => m.teamRole === TeamRole.OWNER)
          .map((m) => m.teamId),
      ),
    ];

    const ownerProjects = ownerTeamIds.length
      ? await this.prisma.project.findMany({
          where: { teamId: { in: ownerTeamIds } },
          select: { id: true },
          orderBy: { id: 'asc' },
        })
      : [];

    const [teamLeadProjectRows, observerProjectRows] = await Promise.all([
      this.prisma.projectMember.findMany({
        where: { userId, role: ProjectRole.TEAM_LEAD },
        select: { projectId: true },
      }),
      this.prisma.projectMember.findMany({
        where: { userId, role: ProjectRole.OBSERVER },
        select: { projectId: true },
      }),
    ]);

    const projectIdsSet = new Set<number>();
    for (const p of ownerProjects) projectIdsSet.add(p.id);
    for (const row of teamLeadProjectRows) projectIdsSet.add(row.projectId);
    for (const row of observerProjectRows) projectIdsSet.add(row.projectId);

    return [...projectIdsSet];
  }
}
