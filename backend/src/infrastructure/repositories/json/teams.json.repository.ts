import { Injectable } from '@nestjs/common';
import { JsonFileService } from '../../storage/json-file.service';
import type { ITeamRepository } from '../../../domain/repositories/team.repository';
import { Team } from '../../../domain/models/team.model';

@Injectable()
export class TeamsJsonRepository implements ITeamRepository {
  private readonly entity = 'teams';

  constructor(private readonly jsonFileService: JsonFileService) {}

  async findAll(): Promise<Team[]> {
    const data = await this.jsonFileService.read<Team>(this.entity);
    return data.items;
  }

  async findById(id: number): Promise<Team | null> {
    const data = await this.jsonFileService.read<Team>(this.entity);
    return data.items.find((t) => t.id === id) ?? null;
  }

  async create(team: Omit<Team, 'id'>): Promise<Team> {
    return this.jsonFileService.create<Team>(this.entity, team);
  }

  async update(id: number, partial: Partial<Team>): Promise<Team | null> {
    return this.jsonFileService.update<Team>(this.entity, id, partial);
  }

  async delete(id: number): Promise<boolean> {
    return this.jsonFileService.remove<Team>(this.entity, id);
  }
}
