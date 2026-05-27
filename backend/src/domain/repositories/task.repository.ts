import { Task } from '../models/task.model';
import {
  RepositoryPageParams,
  RepositoryPageResult,
} from './paginated-query.types';

export interface TaskListQuery extends RepositoryPageParams {
  projectIds?: number[];
  projectId?: number;
  status?: string;
  difficulty?: number;
  assigneeId?: number;
}

export interface ITaskRepository {
  findAll(): Promise<Task[]>;
  findPage(params: TaskListQuery): Promise<RepositoryPageResult<Task>>;
  findById(id: number): Promise<Task | null>;
  findByProject(projectId: number): Promise<Task[]>;
  findByProjects(projectIds: number[]): Promise<Task[]>;
  findByCreator(userId: number): Promise<Task[]>;
  clearAssigneeByUserAndProjects(
    userId: number,
    projectIds: number[],
  ): Promise<number>;
  create(task: Omit<Task, 'id'>): Promise<Task>;
  update(id: number, partial: Partial<Task>): Promise<Task | null>;
  delete(id: number): Promise<boolean>;
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');
