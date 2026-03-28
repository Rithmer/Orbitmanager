import { Team } from '../models/team.model';
import {
  RepositoryPageParams,
  RepositoryPageResult,
} from './paginated-query.types';

export type TeamListQuery = RepositoryPageParams;

export interface ITeamRepository {
  findAll(): Promise<Team[]>;
  findPage(params: TeamListQuery): Promise<RepositoryPageResult<Team>>;
  findById(id: number): Promise<Team | null>;
  findByCreator(userId: number): Promise<Team[]>;
  create(team: Omit<Team, 'id'>): Promise<Team>;
  update(id: number, partial: Partial<Team>): Promise<Team | null>;
  delete(id: number): Promise<boolean>;
}

export const TEAM_REPOSITORY = Symbol('TEAM_REPOSITORY');
