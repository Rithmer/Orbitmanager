import { User } from '../models/user.model';
import type { PaginatedResult, QueryParams } from '@/common/helpers/query.helper';

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  findPaginated(params: QueryParams): Promise<PaginatedResult<User>>;
  create(user: Omit<User, 'id'>): Promise<User>;
  update(id: number, partial: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
