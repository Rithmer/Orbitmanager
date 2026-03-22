import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import type { IUserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '@/domain/repositories/user.repository';
import type { ITeamRepository } from '@/domain/repositories/team.repository';
import { TEAM_REPOSITORY } from '@/domain/repositories/team.repository';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import type { IAuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { User } from '@/domain/models/user.model';
import { AccountRole } from '@/common/enums/account-role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  QueryParams,
  PaginatedResult,
} from '@/common/helpers/query.helper';
import { AuditService } from '../audit-logs/audit.service';
import { AuditAction } from '@/common/enums/audit-action.enum';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: ITeamRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    params: QueryParams,
  ): Promise<PaginatedResult<Omit<User, 'password'>>> {
    const page = normalizePage(params.page);
    const limit = normalizeLimit(params.limit);

    if (this.userRepository.findPage) {
      const result = await this.userRepository.findPage({
        page,
        limit,
        search: params.search,
        sort: params.sort,
        accountRole:
          typeof params.filters?.['accountRole'] === 'string'
            ? (params.filters['accountRole'] as string)
            : undefined,
      });

      return toPaginatedResult(
        result.items.map((user) => this.omitPassword(user)),
        result.total,
        page,
        limit,
      );
    }

    const users = await this.userRepository.findAll();
    const safe = users.map((u) => this.omitPassword(u));
    return applyInMemoryPagination(
      safe
        .filter((user) => {
          const accountRole = params.filters?.['accountRole'];
          if (accountRole === undefined) {
            return true;
          }

          return user.accountRole === accountRole;
        })
        .filter((user) => {
          if (!params.search) {
            return true;
          }

          const search = params.search.toLowerCase();
          return [user.login, user.fullName, user.profession]
            .some((field) => field?.toLowerCase().includes(search));
        }),
      page,
      limit,
    );
  }

  async findById(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.findEntityById(id);
    if (!user) throw new NotFoundException(`Пользователь #${id} не найден`);
    return this.omitPassword(user);
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findByLogin(login);
  }

  async findEntityById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(
    dto: CreateUserDto,
    callerUserId?: number,
  ): Promise<Omit<User, 'password'>> {
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
      avatarUrl: dto.avatarUrl ?? null,
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
    const user = await this.findEntityById(id);
    if (!user) throw new NotFoundException(`Пользователь #${id} не найден`);

    const [createdTeams, createdTasks, auditLogs] = await Promise.all([
      this.teamRepository.findByCreator(id),
      this.taskRepository.findByCreator(id),
      this.auditLogRepository.findByUser(id),
    ]);

    const blockingDependencies = [
      createdTeams.length > 0 ? `команды: ${createdTeams.length}` : null,
      createdTasks.length > 0 ? `задачи: ${createdTasks.length}` : null,
      auditLogs.length > 0 ? `аудит: ${auditLogs.length}` : null,
    ].filter(Boolean);

    if (blockingDependencies.length > 0) {
      throw new ConflictException(
        `Нельзя удалить пользователя #${id}: есть связанные данные (${blockingDependencies.join(', ')})`,
      );
    }

    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    await this.auditService.log(
      callerUserId ?? id,
      AuditAction.DELETE,
      'user',
      id,
      `Удалён пользователь "${user.login}"`,
    );
  }

  private omitPassword(user: User): Omit<User, 'password'> {
    const { password: _password, ...safe } = user;
    void _password;
    return safe;
  }
}

function normalizePage(page: number | undefined): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.trunc(page as number));
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.trunc(limit as number)));
}

function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

function applyInMemoryPagination<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const offset = (page - 1) * limit;
  return toPaginatedResult(items.slice(offset, offset + limit), items.length, page, limit);
}
