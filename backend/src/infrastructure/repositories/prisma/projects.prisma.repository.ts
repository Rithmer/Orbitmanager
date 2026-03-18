import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { Project } from '@/domain/models/project.model';
import type { Project as PrismaProject, Prisma } from '@prisma/client';
import type { QueryParams, PaginatedResult } from '@/common/helpers/query.helper';
import { buildDbPagination, buildDbSort, buildPaginatedResult } from '@/common/helpers/query.helper';

@Injectable()
export class ProjectsPrismaRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: number): Promise<Project | null> {
    const row = await this.prisma.project.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByTeam(teamId: number): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { teamId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByTeams(teamIds: number[]): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPaginated(
    params: QueryParams,
    projectIds?: number[],
  ): Promise<PaginatedResult<Project>> {
    const where: Prisma.ProjectWhereInput = {};

    if (projectIds && projectIds.length > 0) {
      where.id = { in: projectIds };
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
      this.prisma.project.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return buildPaginatedResult(
      rows.map((r) => this.toDomain(r)),
      total,
      pagination,
    );
  }

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    const row = await this.prisma.project.create({
      data: {
        teamId: project.teamId,
        name: project.name,
        description: project.description,
        status: project.status,
      },
    });
    return this.toDomain(row);
  }

  /**
   * Оптимизация: убран предварительный findUnique.
   * Prisma P2025 = запись не найдена → возвращаем null.
   */
  async update(id: number, partial: Partial<Project>): Promise<Project | null> {
    const {
      id: _id,
      createdAt: _ca,
      updatedAt: _ua,
      ...data
    } = partial as Record<string, unknown>;
    try {
      const row = await this.prisma.project.update({ where: { id }, data });
      return this.toDomain(row);
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return null;
      throw e;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.project.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return false;
      throw e;
    }
  }

  private toDomain(row: PrismaProject): Project {
    return {
      id: row.id,
      teamId: row.teamId,
      name: row.name,
      description: row.description,
      status: row.status as Project['status'],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
