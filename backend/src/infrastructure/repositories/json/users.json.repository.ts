import { Injectable } from '@nestjs/common';
import { JsonFileService } from '../../storage/json-file.service';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { User } from '../../../domain/models/user.model';

@Injectable()
export class UsersJsonRepository implements IUserRepository {
  private readonly entity = 'users';

  constructor(private readonly jsonFileService: JsonFileService) {}

  async findAll(): Promise<User[]> {
    const data = await this.jsonFileService.read<User>(this.entity);
    return data.items;
  }

  async findById(id: number): Promise<User | null> {
    const data = await this.jsonFileService.read<User>(this.entity);
    return data.items.find((u) => u.id === id) ?? null;
  }

  async findByLogin(login: string): Promise<User | null> {
    const data = await this.jsonFileService.read<User>(this.entity);
    return data.items.find((u) => u.login === login) ?? null;
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    return this.jsonFileService.create<User>(this.entity, user);
  }

  async update(id: number, partial: Partial<User>): Promise<User | null> {
    return this.jsonFileService.update<User>(this.entity, id, partial);
  }

  async delete(id: number): Promise<boolean> {
    return this.jsonFileService.remove<User>(this.entity, id);
  }
}
