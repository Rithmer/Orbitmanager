import { Injectable } from '@nestjs/common';
import { JsonFileService } from '../../storage/json-file.service';
import type { IProjectMemberRepository } from '../../../domain/repositories/project-member.repository';
import { ProjectMember } from '../../../domain/models/project-member.model';

@Injectable()
export class ProjectMembersJsonRepository implements IProjectMemberRepository {
  private readonly entity = 'project_members';

  constructor(private readonly jsonFileService: JsonFileService) {}

  async findAll(): Promise<ProjectMember[]> {
    const data = await this.jsonFileService.read<ProjectMember>(this.entity);
    return data.items;
  }

  async findByProject(projectId: number): Promise<ProjectMember[]> {
    const data = await this.jsonFileService.read<ProjectMember>(this.entity);
    return data.items.filter((m) => m.projectId === projectId);
  }

  async findByUser(userId: number): Promise<ProjectMember[]> {
    const data = await this.jsonFileService.read<ProjectMember>(this.entity);
    return data.items.filter((m) => m.userId === userId);
  }

  async findByUserAndProject(
    userId: number,
    projectId: number,
  ): Promise<ProjectMember | null> {
    const data = await this.jsonFileService.read<ProjectMember>(this.entity);
    return (
      data.items.find(
        (m) => m.userId === userId && m.projectId === projectId,
      ) ?? null
    );
  }

  async create(member: Omit<ProjectMember, 'id'>): Promise<ProjectMember> {
    return this.jsonFileService.create<ProjectMember>(this.entity, member);
  }

  async update(
    id: number,
    partial: Partial<ProjectMember>,
  ): Promise<ProjectMember | null> {
    return this.jsonFileService.update<ProjectMember>(this.entity, id, partial);
  }

  async delete(id: number): Promise<boolean> {
    return this.jsonFileService.remove<ProjectMember>(this.entity, id);
  }

  async deleteByProject(projectId: number): Promise<number> {
    const members = await this.findByProject(projectId);
    let count = 0;
    for (const m of members) {
      const deleted = await this.jsonFileService.remove<ProjectMember>(this.entity, m.id);
      if (deleted) count++;
    }
    return count;
  }

  async deleteByUserAndProjects(
    userId: number,
    projectIds: number[],
  ): Promise<number> {
    const all = await this.findAll();
    const toDelete = all.filter(
      (m) => m.userId === userId && projectIds.includes(m.projectId),
    );
    let count = 0;
    for (const m of toDelete) {
      const deleted = await this.jsonFileService.remove<ProjectMember>(this.entity, m.id);
      if (deleted) count++;
    }
    return count;
  }
}
