import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ITeamRepository } from '../../../domain/repositories/team.repository';
import { Team } from '../../../domain/models/team.model';
import type { Team as PrismaTeam } from '@prisma/client';

@Injectable()
export class TeamsPrismaRepository implements ITeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Team[]> {
    const rows = await this.prisma.team.findMany({ orderBy: { id: 'asc' } });
    return rows.map(this.toDomain);
  }

  async findById(id: number): Promise<Team | null> {
    const row = await this.prisma.team.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
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
    const exists = await this.prisma.team.findUnique({ where: { id } });
    if (!exists) return null;

    const { id: _id, createdAt: _ca, createdById: _cb, ...data } = partial as Record<string, unknown>;
    const row = await this.prisma.team.update({ where: { id }, data });
    return this.toDomain(row);
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.team.delete({ where: { id } });
      return true;
    } catch {
      return false;
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
