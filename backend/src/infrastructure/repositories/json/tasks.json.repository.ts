import { Injectable } from '@nestjs/common';
import { JsonFileService } from '../../storage/json-file.service';
import type { ITaskRepository } from '../../../domain/repositories/task.repository';
import { Task } from '../../../domain/models/task.model';

@Injectable()
export class TasksJsonRepository implements ITaskRepository {
  private readonly entity = 'tasks';

  constructor(private readonly jsonFileService: JsonFileService) {}

  async findAll(): Promise<Task[]> {
    const data = await this.jsonFileService.read<Task>(this.entity);
    return data.items;
  }

  async findById(id: number): Promise<Task | null> {
    const data = await this.jsonFileService.read<Task>(this.entity);
    return data.items.find((t) => t.id === id) ?? null;
  }

  async findByProject(projectId: number): Promise<Task[]> {
    const data = await this.jsonFileService.read<Task>(this.entity);
    return data.items.filter((t) => t.projectId === projectId);
  }

  async create(task: Omit<Task, 'id'>): Promise<Task> {
    return this.jsonFileService.create<Task>(this.entity, task);
  }

  async update(id: number, partial: Partial<Task>): Promise<Task | null> {
    return this.jsonFileService.update<Task>(this.entity, id, partial);
  }

  async delete(id: number): Promise<boolean> {
    return this.jsonFileService.remove<Task>(this.entity, id);
  }
}
