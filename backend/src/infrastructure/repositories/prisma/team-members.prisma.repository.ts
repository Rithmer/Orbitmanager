import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { ITeamMemberRepository } from '../../../domain/repositories/team-member.repository';
import { TeamMember } from '../../../domain/models/team-member.model';
import type { TeamMember as PrismaTeamMember } from '@prisma/client';

@Injectable()
export class TeamMembersPrismaRepository implements ITeamMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TeamMember[]> {
    const rows = await this.prisma.teamMember.findMany({ orderBy: { id: 'asc' } });
    return rows.map(this.toDomain);
  }

  async findById(id: number): Promise<TeamMember | null> {
    const row = await this.prisma.teamMember.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByTeam(teamId: number): Promise<TeamMember[]> {
    const rows = await this.prisma.teamMember.findMany({ where: { teamId }, orderBy: { id: 'asc' } });
    return rows.map(this.toDomain);
  }

  async findByUser(userId: number): Promise<TeamMember[]> {
    const rows = await this.prisma.teamMember.findMany({ where: { userId }, orderBy: { id: 'asc' } });
    return rows.map(this.toDomain);
  }

  async findByUserAndTeam(userId: number, teamId: number): Promise<TeamMember | null> {
    const row = await this.prisma.teamMember.findUnique({
      where: { userId_teamId: { userId, teamId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    const row = await this.prisma.teamMember.create({
      data: {
        userId: member.userId,
        teamId: member.teamId,
        teamRole: member.teamRole,
      },
    });
    return this.toDomain(row);
  }

  /**
   * Оптимизация: убран предварительный findUnique.
   * Prisma P2025 = запись не найдена → возвращаем null.
   */
  async update(id: number, partial: Partial<TeamMember>): Promise<TeamMember | null> {
    const { id: _id, ...data } = partial as Record<string, unknown>;
    try {
      const row = await this.prisma.teamMember.update({ where: { id }, data });
      return this.toDomain(row);
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return null;
      throw e;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.teamMember.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  private toDomain(row: PrismaTeamMember): TeamMember {
    return {
      id: row.id,
      userId: row.userId,
      teamId: row.teamId,
      teamRole: row.teamRole as TeamMember['teamRole'],
    };
  }
}
