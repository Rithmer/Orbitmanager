import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type {
  ITeamRepository,
  TeamListQuery,
} from '@/domain/repositories/team.repository';
import { Team } from '@/domain/models/team.model';
import type { Team as PrismaTeam } from '@prisma/client';
import {
  buildOrderBy,
  buildStringSearch,
  getPagination,
} from './prisma-query.utils';

@Injectable()
export class TeamsPrismaRepository implements ITeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Team[]> {
    const rows = await this.prisma.team.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findPage(params: TeamListQuery) {
    const { skip, take } = getPagination(params.page, params.limit);
    const where = buildStringSearch(params.search, ['name', 'description']);

    const [rows, total] = await Promise.all([
      this.prisma.team.findMany({
        where,
        orderBy: buildOrderBy(
          params.sort,
          ['id', 'name', 'description', 'createdAt', 'createdById'],
          'id',
        ),
        skip,
        take,
      }),
      this.prisma.team.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
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
      if (prismaError.code === 'P2025') return null;
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
