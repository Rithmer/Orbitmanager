import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type {
  IProjectRepository,
  ProjectListQuery,
} from '@/domain/repositories/project.repository';
import { Project } from '@/domain/models/project.model';
import type { Project as PrismaProject } from '@prisma/client';
import { buildOrderBy, buildStringSearch, getPagination } from './prisma-query.utils';

@Injectable()
export class ProjectsPrismaRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findPage(params: ProjectListQuery) {
    const { skip, take } = getPagination(params.page, params.limit);
    const where = {
      ...(params.projectIds ? { id: { in: params.projectIds } } : {}),
      ...(params.teamId !== undefined ? { teamId: params.teamId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...buildStringSearch(params.search, ['name', 'description']),
    };

    const [rows, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: buildOrderBy(
          params.sort,
          ['id', 'teamId', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
          'id',
        ),
        skip,
        take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async findById(id: number): Promise<Project | null> {
    const row = await this.prisma.project.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIds(ids: number[]): Promise<Project[]> {
    if (ids.length === 0) {
      return [];
    }

    const rows = await this.prisma.project.findMany({
      where: { id: { in: ids } },
      orderBy: { id: 'asc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async findByTeam(teamId: number): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { teamId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByTeams(teamIds: number[]): Promise<Project[]> {
    if (teamIds.length === 0) return [];
    const rows = await this.prisma.project.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findIdsByTeams(teamIds: number[]): Promise<number[]> {
    if (teamIds.length === 0) {
      return [];
    }

    const rows = await this.prisma.project.findMany({
      where: { teamId: { in: teamIds } },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    return rows.map((row) => row.id);
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
