import { ProjectMember } from '../models/project-member.model';

export interface IProjectMemberRepository {
  findAll(): Promise<ProjectMember[]>;
  findByProject(projectId: number): Promise<ProjectMember[]>;
  findByUser(userId: number): Promise<ProjectMember[]>;
  findByUserAndProject(userId: number, projectId: number): Promise<ProjectMember | null>;
  create(member: Omit<ProjectMember, 'id'>): Promise<ProjectMember>;
  update(id: number, partial: Partial<ProjectMember>): Promise<ProjectMember | null>;
  delete(id: number): Promise<boolean>;
  deleteByProject(projectId: number): Promise<number>;
  deleteByUserAndProjects(userId: number, projectIds: number[]): Promise<number>;
}

export const PROJECT_MEMBER_REPOSITORY = Symbol('PROJECT_MEMBER_REPOSITORY');
