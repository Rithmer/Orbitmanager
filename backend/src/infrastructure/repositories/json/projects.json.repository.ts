import { Injectable } from '@nestjs/common';
import { JsonFileService } from '../../storage/json-file.service';
import type { IProjectRepository } from '../../../domain/repositories/project.repository';
import { Project } from '../../../domain/models/project.model';

@Injectable()
export class ProjectsJsonRepository implements IProjectRepository {
  private readonly entity = 'projects';

  constructor(private readonly jsonFileService: JsonFileService) {}

  async findAll(): Promise<Project[]> {
    const data = await this.jsonFileService.read<Project>(this.entity);
    return data.items;
  }

  async findById(id: number): Promise<Project | null> {
    const data = await this.jsonFileService.read<Project>(this.entity);
    return data.items.find((p) => p.id === id) ?? null;
  }

  async findByTeam(teamId: number): Promise<Project[]> {
    const data = await this.jsonFileService.read<Project>(this.entity);
    return data.items.filter((p) => p.teamId === teamId);
  }

  async findByTeams(teamIds: number[]): Promise<Project[]> {
    const data = await this.jsonFileService.read<Project>(this.entity);
    const set = new Set(teamIds);
    return data.items.filter((p) => set.has(p.teamId));
  }

  async create(project: Omit<Project, 'id'>): Promise<Project> {
    return this.jsonFileService.create<Project>(this.entity, project);
  }

  async update(id: number, partial: Partial<Project>): Promise<Project | null> {
    return this.jsonFileService.update<Project>(this.entity, id, partial);
  }

  async delete(id: number): Promise<boolean> {
    return this.jsonFileService.remove<Project>(this.entity, id);
  }
}
