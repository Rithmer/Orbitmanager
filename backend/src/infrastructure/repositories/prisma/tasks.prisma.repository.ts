import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { Task } from '@/domain/models/task.model';
import type { Task as PrismaTask, Prisma } from '@prisma/client';
import type { QueryParams, PaginatedResult } from '@/common/helpers/query.helper';
import { buildDbPagination, buildDbSort, buildPaginatedResult } from '@/common/helpers/query.helper';

@Injectable()
export class TasksPrismaRepository implements ITaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: number): Promise<Task | null> {
    const row = await this.prisma.task.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByProject(projectId: number): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByProjects(projectIds: number[]): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByCreator(userId: number): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({
      where: { createdById: userId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPaginated(
    params: QueryParams,
    projectIds?: number[],
  ): Promise<PaginatedResult<Task>> {
    const where: Prisma.TaskWhereInput = {};

    if (projectIds && projectIds.length > 0) {
      where.projectId = { in: projectIds };
    }

    if (params.filters) {
      for (const [key, value] of Object.entries(params.filters)) {
        if (value !== undefined && value !== null) {
          (where as Record<string, unknown>)[key] = value;
        }
      }
    }

    if (params.search) {
      const searchFields = params.searchFields ?? ['name', 'description'];
      where.OR = searchFields.map((field) => ({
        [field]: { contains: params.search, mode: 'insensitive' as const },
      }));
    }

    const pagination = buildDbPagination(params.page, params.limit);
    const sortSpec = buildDbSort(params.sort);
    const orderBy = sortSpec
      ? { [sortSpec.field]: sortSpec.direction }
      : { id: 'asc' as const };

    const [rows, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.task.count({ where }),
    ]);

    return buildPaginatedResult(
      rows.map((r) => this.toDomain(r)),
      total,
      pagination,
    );
  }

  async clearAssigneeByUserAndProjects(
    userId: number,
    projectIds: number[],
  ): Promise<number> {
    if (projectIds.length === 0) {
      return 0;
    }

    const result = await this.prisma.task.updateMany({
      where: {
        assigneeId: userId,
        projectId: { in: projectIds },
      },
      data: {
        assigneeId: null,
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
        assigneeId: task.assigneeId,
        createdById: task.createdById,
      },
    });
    return this.toDomain(row);
  }

  /**
   * Оптимизация: убран предварительный findUnique — экономия 1 запроса к БД.
   * Prisma P2025 = запись не найдена → возвращаем null.
   */
  async update(id: number, partial: Partial<Task>): Promise<Task | null> {
    const data: Record<string, unknown> = {};
    if (partial.name !== undefined) data['name'] = partial.name;
    if (partial.description !== undefined)
      data['description'] = partial.description;
    if (partial.deadline !== undefined)
      data['deadline'] = new Date(partial.deadline);
    if (partial.status !== undefined) data['status'] = partial.status;
    if (partial.difficulty !== undefined)
      data['difficulty'] = partial.difficulty;
    if (partial.assigneeId !== undefined)
      data['assigneeId'] = partial.assigneeId;

    try {
      const row = await this.prisma.task.update({ where: { id }, data });
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

  private toDomain(row: PrismaTask): Task {
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
}
