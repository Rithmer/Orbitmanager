import { User } from '../models/user.model';
import {
  RepositoryPageParams,
  RepositoryPageResult,
} from './paginated-query.types';

export interface UserListQuery extends RepositoryPageParams {
  accountRole?: string;
}

export interface IUserRepository {
  findAll(): Promise<User[]>;
  findPage?(params: UserListQuery): Promise<RepositoryPageResult<User>>;
  findById(id: number): Promise<User | null>;
  findByLogin(login: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'discriminator'>): Promise<User>;
  update(id: number, partial: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
