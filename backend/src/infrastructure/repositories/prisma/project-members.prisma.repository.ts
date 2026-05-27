import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type { IProjectMemberRepository } from '@/domain/repositories/project-member.repository';
import { ProjectMember } from '@/domain/models/project-member.model';
import type { ProjectMember as PrismaProjectMember } from '@prisma/client';

@Injectable()
export class ProjectMembersPrismaRepository implements IProjectMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ProjectMember[]> {
    const rows = await this.prisma.projectMember.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: number): Promise<ProjectMember | null> {
    const row = await this.prisma.projectMember.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByProject(projectId: number): Promise<ProjectMember[]> {
    const rows = await this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByProjects(projectIds: number[]): Promise<ProjectMember[]> {
    if (projectIds.length === 0) return [];
    const rows = await this.prisma.projectMember.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByUser(userId: number): Promise<ProjectMember[]> {
    const rows = await this.prisma.projectMember.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByUserAndProject(
    userId: number,
    projectId: number,
  ): Promise<ProjectMember | null> {
    const row = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    return row ? this.toDomain(row) : null;
  }

  async create(member: Omit<ProjectMember, 'id'>): Promise<ProjectMember> {
    const row = await this.prisma.projectMember.create({
      data: {
        projectId: member.projectId,
        userId: member.userId,
        role: member.role,
      },
    });
    return this.toDomain(row);
  }

  async update(
    id: number,
    partial: Partial<ProjectMember>,
  ): Promise<ProjectMember | null> {
    const {
      id: _id,
      assignedAt: _aa,
      ...data
    } = partial as Record<string, unknown>;
    try {
      const row = await this.prisma.projectMember.update({
        where: { id },
        data,
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
      await this.prisma.projectMember.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return false;
      throw e;
    }
  }

  async deleteByProject(projectId: number): Promise<number> {
    const result = await this.prisma.projectMember.deleteMany({
      where: { projectId },
    });
    return result.count;
  }

  async deleteByUserAndProjects(
    userId: number,
    projectIds: number[],
  ): Promise<number> {
    const result = await this.prisma.projectMember.deleteMany({
      where: { userId, projectId: { in: projectIds } },
    });
    return result.count;
  }

  private toDomain(row: PrismaProjectMember): ProjectMember {
    return {
      id: row.id,
      projectId: row.projectId,
      userId: row.userId,
      role: row.role as ProjectMember['role'],
      assignedAt: row.assignedAt.toISOString(),
    };
  }
}
