import { Team } from '../models/team.model';

export interface ITeamRepository {
  findAll(): Promise<Team[]>;
  findById(id: number): Promise<Team | null>;
  create(team: Omit<Team, 'id'>): Promise<Team>;
  update(id: number, partial: Partial<Team>): Promise<Team | null>;
  delete(id: number): Promise<boolean>;
}

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');
