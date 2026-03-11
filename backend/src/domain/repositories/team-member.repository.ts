import { TeamMember } from '../models/team-member.model';

export interface ITeamMemberRepository {
  findAll(): Promise<TeamMember[]>;
  findById(id: number): Promise<TeamMember | null>;
  findByTeam(teamId: number): Promise<TeamMember[]>;
  findByUser(userId: number): Promise<TeamMember[]>;
  findByUserAndTeam(userId: number, teamId: number): Promise<TeamMember | null>;
  create(member: Omit<TeamMember, 'id'>): Promise<TeamMember>;
  update(id: number, partial: Partial<TeamMember>): Promise<TeamMember | null>;
  delete(id: number): Promise<boolean>;
}

export const TEAM_MEMBER_REPOSITORY = Symbol('TEAM_MEMBER_REPOSITORY');
