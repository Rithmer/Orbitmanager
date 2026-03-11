import { Project } from '../models/project.model';

export interface IProjectRepository {
  findAll(): Promise<Project[]>;
  findById(id: number): Promise<Project | null>;
  findByTeam(teamId: number): Promise<Project[]>;
  create(project: Omit<Project, 'id'>): Promise<Project>;
  update(id: number, partial: Partial<Project>): Promise<Project | null>;
  delete(id: number): Promise<boolean>;
}

export const PROJECT_REPOSITORY = Symbol('PROJECT_REPOSITORY');
