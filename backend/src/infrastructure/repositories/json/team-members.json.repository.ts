import { Injectable } from '@nestjs/common';
import { JsonFileService } from '../../storage/json-file.service';
import type { ITeamMemberRepository } from '../../../domain/repositories/team-member.repository';
import { TeamMember } from '../../../domain/models/team-member.model';

@Injectable()
export class TeamMembersJsonRepository implements ITeamMemberRepository {
  private readonly entity = 'team_members';

  constructor(private readonly jsonFileService: JsonFileService) {}

  async findAll(): Promise<TeamMember[]> {
    const data = await this.jsonFileService.read<TeamMember>(this.entity);
    return data.items;
  }

  async findById(id: number): Promise<TeamMember | null> {
    const data = await this.jsonFileService.read<TeamMember>(this.entity);
    return data.items.find((m) => m.id === id) ?? null;
  }

  async findByTeam(teamId: number): Promise<TeamMember[]> {
    const data = await this.jsonFileService.read<TeamMember>(this.entity);
    return data.items.filter((m) => m.teamId === teamId);
  }

  async findByUser(userId: number): Promise<TeamMember[]> {
    const data = await this.jsonFileService.read<TeamMember>(this.entity);
    return data.items.filter((m) => m.userId === userId);
  }

  async findByUserAndTeam(
    userId: number,
    teamId: number,
  ): Promise<TeamMember | null> {
    const data = await this.jsonFileService.read<TeamMember>(this.entity);
    return (
      data.items.find((m) => m.userId === userId && m.teamId === teamId) ??
      null
    );
  }

  async create(member: Omit<TeamMember, 'id'>): Promise<TeamMember> {
    return this.jsonFileService.create<TeamMember>(this.entity, member);
  }

  async update(
    id: number,
    partial: Partial<TeamMember>,
  ): Promise<TeamMember | null> {
    return this.jsonFileService.update<TeamMember>(this.entity, id, partial);
  }

  async delete(id: number): Promise<boolean> {
    return this.jsonFileService.remove<TeamMember>(this.entity, id);
  }
}
