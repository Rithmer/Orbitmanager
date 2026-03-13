import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IProjectRepository } from '../../../domain/repositories/project.repository';
import { Project } from '../../../domain/models/project.model';
import type { Project as PrismaProject } from '@prisma/client';

@Injectable()
export class ProjectsPrismaRepository implements IProjectRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({ orderBy: { id: 'asc' } });
    return rows.map(this.toDomain);
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
    return rows.map(this.toDomain);
  }

  async findByTeams(teamIds: number[]): Promise<Project[]> {
    const rows = await this.prisma.project.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { id: 'asc' },
    });
    return rows.map(this.toDomain);
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
    const { id: _id, createdAt: _ca, updatedAt: _ua, ...data } = partial as Record<string, unknown>;
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
