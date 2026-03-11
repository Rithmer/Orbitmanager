import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { User } from '../../domain/models/user.model';
import { AccountRole } from '../../common/enums/account-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  QueryHelper,
  QueryParams,
  PaginatedResult,
} from '../../common/helpers/query.helper';
import { AuditService } from '../audit-logs/audit.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: QueryParams): Promise<PaginatedResult<Omit<User, 'password'>>> {
    const users = await this.userRepository.findAll();
    const safe = users.map((u) => this.omitPassword(u));
    return QueryHelper.apply(safe, {
      ...params,
      searchFields: params.searchFields ?? ['login', 'fullName', 'profession'],
    }) as PaginatedResult<Omit<User, 'password'>>;
  }

  async findById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`Пользователь #${id} не найден`);
    return this.omitPassword(user);
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findByLogin(login);
  }

  async create(dto: CreateUserDto, callerUserId?: number): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findByLogin(dto.login);
    if (existing) {
      throw new ConflictException(`Логин "${dto.login}" уже занят`);
    }

    const hashedPassword = await argon2.hash(dto.password);
    const now = new Date().toISOString();

    const user = await this.userRepository.create({
      login: dto.login,
      password: hashedPassword,
      fullName: dto.fullName,
      profession: dto.profession,
      accountStatus: 'active',
      accountRole: dto.accountRole ?? AccountRole.MEMBER,
      createdAt: now,
      updatedAt: now,
    });

    await this.auditService.log(
      callerUserId ?? user.id,
      AuditAction.CREATE,
      'user',
      user.id,
      `Создан пользователь "${user.login}"`,
    );

    return this.omitPassword(user);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    callerUserId?: number,
  ): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new NotFoundException(`Пользователь #${id} не найден`);

    const partial: Partial<User> = {
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    if (dto.password) {
      partial.password = await argon2.hash(dto.password);
    }

    const updated = await this.userRepository.update(id, partial);
    if (!updated) throw new NotFoundException(`Пользователь #${id} не найден`);

    await this.auditService.log(
      callerUserId ?? id,
      AuditAction.UPDATE,
      'user',
      id,
      `Обновлён пользователь "${updated.login}"`,
    );

    return this.omitPassword(updated);
  }

  async remove(id: number, callerUserId?: number): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException(`Пользователь #${id} не найден`);

    await this.userRepository.delete(id);

    await this.auditService.log(
      callerUserId ?? id,
      AuditAction.DELETE,
      'user',
      id,
      `Удалён пользователь "${user.login}"`,
    );
  }

  private omitPassword(user: User): Omit<User, 'password'> {
    const { password: _, ...safe } = user;
    return safe;
  }
}
