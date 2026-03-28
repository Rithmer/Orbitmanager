import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import type { TaskRiskInput } from '@/domain/services/risk-assessment.interface';

export interface ProjectMemberRecord {
  userId: number;
  role: string;
  fullName: string;
  profession: string;
  accountStatus: string;
}

export interface TaskRecord {
  id: number;
  projectId: number;
  name: string;
  status: string;
  difficulty: number;
  deadline: Date;
  createdAt: Date;
  assigneeIds: number[];
}

export interface RiskPageContext {
  projectIds: number[];
  projectNamesById: Map<number, string>;
  tasksByProject: Map<number, TaskRecord[]>;
  membersByProject: Map<number, ProjectMemberRecord[]>;
  inputsByTaskId: Map<number, TaskRiskInput>;
  allInputs: TaskRiskInput[];
}

const ACTIVE_STATUSES = [
  TaskStatus.NEW,
  TaskStatus.IN_PROGRESS,
  TaskStatus.REVIEW,
];

/**
 * @architecture CQRS Query Service
 * Direct Prisma access for multi-join risk page projections.
 */
@Injectable()
export class RiskPageReadModelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async loadContext(
    userId: number,
    userRole: AccountRole,
    requestedProjectIds?: number[],
  ): Promise<RiskPageContext> {
    const projectIds = await this.resolveProjectIds(
      userId,
      userRole,
      requestedProjectIds,
    );

    if (projectIds.length === 0) {
      return {
        projectIds: [],
        projectNamesById: new Map(),
        tasksByProject: new Map(),
        membersByProject: new Map(),
        inputsByTaskId: new Map(),
        allInputs: [],
      };
    }

    const [projects, rawTasks, members] = await Promise.all([
      this.prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, name: true },
      }),
      this.prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
          status: { in: ACTIVE_STATUSES },
        },
        select: {
          id: true,
          projectId: true,
          name: true,
          status: true,
          difficulty: true,
          deadline: true,
          createdAt: true,
          assignees: { select: { userId: true } },
        },
      }),
      this.prisma.projectMember.findMany({
        where: { projectId: { in: projectIds } },
        select: {
          projectId: true,
          userId: true,
          role: true,
          user: {
            select: {
              fullName: true,
              profession: true,
              accountStatus: true,
            },
          },
        },
      }),
    ]);

    const projectNamesById = new Map(projects.map((p) => [p.id, p.name]));

    const tasks: TaskRecord[] = rawTasks.map((t) => ({
      id: t.id,
      projectId: t.projectId,
      name: t.name,
      status: t.status,
      difficulty: t.difficulty,
      deadline: t.deadline,
      createdAt: t.createdAt,
      assigneeIds: t.assignees.map((a) => a.userId),
    }));

    const tasksByProject = new Map<number, TaskRecord[]>();
    for (const task of tasks) {
      const list = tasksByProject.get(task.projectId) ?? [];
      list.push(task);
      tasksByProject.set(task.projectId, list);
    }

    const membersByProject = new Map<number, ProjectMemberRecord[]>();
    for (const m of members) {
      const list = membersByProject.get(m.projectId) ?? [];
      list.push({
        userId: m.userId,
        role: m.role,
        fullName: m.user.fullName,
        profession: m.user.profession,
        accountStatus: m.user.accountStatus,
      });
      membersByProject.set(m.projectId, list);
    }

    const taskIds = tasks.map((t) => t.id);
    const statusChanges =
      taskIds.length > 0
        ? await this.prisma.auditLog.groupBy({
            by: ['entityId'],
            where: {
              entityType: 'task',
              entityId: { in: taskIds },
              action: AuditAction.STATUS_CHANGE,
            },
            _count: { id: true },
          })
        : [];

    const statusChangesByTaskId = new Map<number, number>();
    for (const row of statusChanges) {
      if (row.entityId !== null) {
        statusChangesByTaskId.set(row.entityId, row._count.id);
      }
    }

    const assigneeLoadMap = this.buildAssigneeLoadMap(tasks);
    const inputsByTaskId = new Map<number, TaskRiskInput>();
    const allInputs: TaskRiskInput[] = [];

    const now = new Date();
    for (const task of tasks) {
      const deadline = task.deadline;
      const created = task.createdAt;
      const daysSinceCreation = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
      );
      const daysUntilDeadline = Math.floor(
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      const input: TaskRiskInput = {
        taskId: task.id,
        difficulty: task.difficulty,
        deadline: deadline.toISOString(),
        createdAt: created.toISOString(),
        status: task.status as TaskStatus,
        assigneeCount: task.assigneeIds.length,
        assigneeLoad: assigneeLoadMap.get(task.id) ?? 0,
        statusChangesCount: statusChangesByTaskId.get(task.id) ?? 0,
        daysSinceCreation,
        daysUntilDeadline,
      };

      inputsByTaskId.set(task.id, input);
      allInputs.push(input);
    }

    return {
      projectIds,
      projectNamesById,
      tasksByProject,
      membersByProject,
      inputsByTaskId,
      allInputs,
    };
  }

  private async resolveProjectIds(
    userId: number,
    userRole: AccountRole,
    requestedProjectIds?: number[],
  ): Promise<number[]> {
    if (requestedProjectIds && requestedProjectIds.length > 0) {
      if (userRole === AccountRole.ADMIN) {
        const found = await this.prisma.project.findMany({
          where: { id: { in: requestedProjectIds } },
          select: { id: true },
        });
        return found.map((p) => p.id);
      }
      const visible =
        await this.projectAccessService.getVisibleProjects(userId);
      const requestedSet = new Set(requestedProjectIds);
      return visible.filter((p) => requestedSet.has(p.id)).map((p) => p.id);
    }

    if (userRole === AccountRole.ADMIN) {
      const all = await this.prisma.project.findMany({ select: { id: true } });
      return all.map((p) => p.id);
    }

    const visible = await this.projectAccessService.getVisibleProjects(userId);
    return visible.map((p) => p.id);
  }

  private buildAssigneeLoadMap(tasks: TaskRecord[]): Map<number, number> {
    const activeCountsByAssignee = new Map<number, number>();
    for (const task of tasks) {
      for (const uid of task.assigneeIds) {
        activeCountsByAssignee.set(
          uid,
          (activeCountsByAssignee.get(uid) ?? 0) + 1,
        );
      }
    }

    const result = new Map<number, number>();
    for (const task of tasks) {
      if (task.assigneeIds.length === 0) {
        result.set(task.id, 0);
        continue;
      }
      const maxLoad = Math.max(
        ...task.assigneeIds.map((uid) => activeCountsByAssignee.get(uid) ?? 0),
      );
      result.set(task.id, Math.max(0, maxLoad - 1));
    }

    return result;
  }
}
