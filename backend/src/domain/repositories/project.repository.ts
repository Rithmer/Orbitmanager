import { Project } from '../models/project.model';
import {
  RepositoryPageParams,
  RepositoryPageResult,
} from './paginated-query.types';

export interface ProjectListQuery extends RepositoryPageParams {
  projectIds?: number[];
  teamId?: number;
  status?: string;
}

export interface IProjectRepository {
  findAll(): Promise<Project[]>;
  findPage?(params: ProjectListQuery): Promise<RepositoryPageResult<Project>>;
  findById(id: number): Promise<Project | null>;
  findByIds(ids: number[]): Promise<Project[]>;
  findByTeam(teamId: number): Promise<Project[]>;
  findByTeams(teamIds: number[]): Promise<Project[]>;
  findIdsByTeams(teamIds: number[]): Promise<number[]>;
  create(project: Omit<Project, 'id'>): Promise<Project>;
  update(id: number, partial: Partial<Project>): Promise<Project | null>;
  delete(id: number): Promise<boolean>;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
