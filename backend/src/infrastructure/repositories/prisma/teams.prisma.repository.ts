import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type { ITeamRepository } from '@/domain/repositories/team.repository';
import { Team } from '@/domain/models/team.model';
import type { Team as PrismaTeam, Prisma } from '@prisma/client';
import type { QueryParams, PaginatedResult } from '@/common/helpers/query.helper';
import { buildDbPagination, buildDbSort, buildPaginatedResult } from '@/common/helpers/query.helper';

@Injectable()
export class TeamsPrismaRepository implements ITeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Team[]> {
    const rows = await this.prisma.team.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: number): Promise<Team | null> {
    const row = await this.prisma.team.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByCreator(userId: number): Promise<Team[]> {
    const rows = await this.prisma.team.findMany({
      where: { createdById: userId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPaginated(params: QueryParams): Promise<PaginatedResult<Team>> {
    const where: Prisma.TeamWhereInput = {};

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
      this.prisma.team.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.team.count({ where }),
    ]);

    return buildPaginatedResult(
      rows.map((r) => this.toDomain(r)),
      total,
      pagination,
    );
  }

  async create(team: Omit<Team, 'id'>): Promise<Team> {
    const row = await this.prisma.team.create({
      data: {
        name: team.name,
        description: team.description,
        createdById: team.createdById,
      },
    });
    return this.toDomain(row);
  }

  /**
   * Оптимизация: убран предварительный findUnique.
   * Prisma выбрасывает P2025 если запись не найдена — перехватываем и возвращаем null.
   * Это сокращает количество запросов к БД с 2 до 1.
   */
  async update(id: number, partial: Partial<Team>): Promise<Team | null> {
    const {
      id: _id,
      createdAt: _ca,
      createdById: _cb,
      ...data
    } = partial as Record<string, unknown>;
    try {
      const row = await this.prisma.team.update({ where: { id }, data });
      return this.toDomain(row);
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return null; // Record not found
      throw e;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.team.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return false;
      throw e;
    }
  }

  private toDomain(row: PrismaTeam): Team {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
      createdById: row.createdById,
    };
  }
}
