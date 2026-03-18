import { Team } from '../models/team.model';
import type { PaginatedResult, QueryParams } from '@/common/helpers/query.helper';

export interface ITeamRepository {
  findAll(): Promise<Team[]>;
  findById(id: number): Promise<Team | null>;
  findByCreator(userId: number): Promise<Team[]>;
  findPaginated(params: QueryParams): Promise<PaginatedResult<Team>>;
  create(team: Omit<Team, 'id'>): Promise<Team>;
  update(id: number, partial: Partial<Team>): Promise<Team | null>;
  delete(id: number): Promise<boolean>;
}

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');
