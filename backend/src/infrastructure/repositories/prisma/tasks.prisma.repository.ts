import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type {
  ITaskRepository,
  TaskListQuery,
} from '@/domain/repositories/task.repository';
import { Task } from '@/domain/models/task.model';
import {
  buildOrderBy,
  buildStringSearch,
  getPagination,
} from './prisma-query.utils';

type TaskWithAssignees = {
  id: number;
  projectId: number;
  name: string;
  description: string;
  deadline: Date;
  status: string;
  difficulty: number;
  createdById: number;
  createdAt: Date;
  updatedAt: Date;
  assignees: { userId: number }[];
};

const TASK_INCLUDE = { assignees: { select: { userId: true } } } as const;

@Injectable()
export class TasksPrismaRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      orderBy: { id: 'asc' },
      include: TASK_INCLUDE,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPage(params: TaskListQuery) {
    const { skip, take } = getPagination(params.page, params.limit);
    const where = {
      ...(params.projectIds ? { projectId: { in: params.projectIds } } : {}),
      ...(params.projectId !== undefined
        ? { projectId: params.projectId }
        : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.difficulty !== undefined
        ? { difficulty: params.difficulty }
        : {}),
      ...(params.assigneeId !== undefined
        ? { assignees: { some: { userId: params.assigneeId } } }
        : {}),
      ...buildStringSearch(params.search, ['name', 'description']),
    };

    const [rows, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: TASK_INCLUDE,
        orderBy: buildOrderBy(
          params.sort,
          [
            'id',
            'projectId',
            'name',
            'description',
            'deadline',
            'status',
            'difficulty',
            'createdById',
            'createdAt',
            'updatedAt',
          ],
          'id',
        ),
        skip,
        take,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async findById(id: number): Promise<Task | null> {
    const row = await this.prisma.task.findUnique({
      where: { id },
      include: TASK_INCLUDE,
    });
    return row ? this.toDomain(row) : null;
  }

  async findByProject(projectId: number): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
      include: TASK_INCLUDE,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByProjects(projectIds: number[]): Promise<Task[]> {
    if (projectIds.length === 0) return [];
    const rows = await this.prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { id: 'asc' },
      include: TASK_INCLUDE,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByCreator(userId: number): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: { createdById: userId },
      orderBy: { id: 'asc' },
      include: TASK_INCLUDE,
    });
    return rows.map((r) => this.toDomain(r));
  }

  async clearAssigneeByUserAndProjects(
    userId: number,
    projectIds: number[],
  ): Promise<number> {
    if (projectIds.length === 0) {
      return 0;
    }

    const result = await this.prisma.taskAssignee.deleteMany({
      where: {
        userId,
        task: { projectId: { in: projectIds } },
      },
    });

    return result.count;
  }

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    const row = await this.prisma.task.create({
      data: {
        projectId: task.projectId,
        name: task.name,
        description: task.description,
        deadline: new Date(task.deadline),
        status: task.status,
        difficulty: task.difficulty,
        createdById: task.createdById,
        assignees:
          task.assigneeIds.length > 0
            ? { create: task.assigneeIds.map((userId) => ({ userId })) }
            : undefined,
      },
      include: TASK_INCLUDE,
    });
    return this.toDomain(row);
  }

  async update(id: number, partial: Partial<Task>): Promise<Task | null> {
    try {
      const scalarData: Record<string, unknown> = {};
      if (partial.name !== undefined) scalarData['name'] = partial.name;
      if (partial.description !== undefined)
        scalarData['description'] = partial.description;
      if (partial.deadline !== undefined)
        scalarData['deadline'] = new Date(partial.deadline);
      if (partial.status !== undefined) scalarData['status'] = partial.status;
      if (partial.difficulty !== undefined)
        scalarData['difficulty'] = partial.difficulty;

      if (partial.assigneeIds !== undefined) {
        const newIds = partial.assigneeIds ?? [];
        const row = await this.prisma.$transaction(async (tx) => {
          await tx.taskAssignee.deleteMany({ where: { taskId: id } });
          const updated = await tx.task.update({
            where: { id },
            data: {
              ...scalarData,
              ...(newIds.length > 0
                ? {
                    assignees: { create: newIds.map((userId) => ({ userId })) },
                  }
                : {}),
            },
            include: TASK_INCLUDE,
          });
          return updated;
        });
        return this.toDomain(row);
      }

      const row = await this.prisma.task.update({
        where: { id },
        data: scalarData,
        include: TASK_INCLUDE,
      });
      return this.toDomain(row);
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return null;
      throw e;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.task.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return false;
      throw e;
    }
  }

  private toDomain(row: TaskWithAssignees): Task {
    return {
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      description: row.description,
      deadline: row.deadline.toISOString(),
      status: row.status as Task['status'],
      difficulty: row.difficulty,
      assigneeIds: row.assignees.map((a) => a.userId),
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
