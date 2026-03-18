import { Task } from '../models/task.model';
import type { PaginatedResult, QueryParams } from '@/common/helpers/query.helper';

export interface ITaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: number): Promise<Task | null>;
  findByProject(projectId: number): Promise<Task[]>;
  findByProjects(projectIds: number[]): Promise<Task[]>;
  findByCreator(userId: number): Promise<Task[]>;
  findPaginated(
    params: QueryParams,
    projectIds?: number[],
  ): Promise<PaginatedResult<Task>>;
  clearAssigneeByUserAndProjects(
    userId: number,
    projectIds: number[],
  ): Promise<number>;
  create(task: Omit<Task, 'id'>): Promise<Task>;
  update(id: number, partial: Partial<Task>): Promise<Task | null>;
  delete(id: number): Promise<boolean>;
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');
