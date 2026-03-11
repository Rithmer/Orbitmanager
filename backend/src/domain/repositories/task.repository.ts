import { Task } from '../models/task.model';

export interface ITaskRepository {
  findAll(): Promise<Task[]>;
  findById(id: number): Promise<Task | null>;
  findByProject(projectId: number): Promise<Task[]>;
  findByProjects(projectIds: number[]): Promise<Task[]>;
  create(task: Omit<Task, 'id'>): Promise<Task>;
  update(id: number, partial: Partial<Task>): Promise<Task | null>;
  delete(id: number): Promise<boolean>;
}

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');
