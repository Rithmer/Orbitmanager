import {
  Injectable,
  Inject,
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { TtlCacheService } from '@/common/cache/ttl-cache.service';
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
import { CreateUserDto, UpdateMeUserDto, UpdateUserDto } from './dto';
import {
  QueryParams,
  PaginatedResult,
} from '@/common/helpers/query.helper';
import { AuditService } from '../audit-logs/audit.service';
import { AuditAction } from '@/common/enums/audit-action.enum';

const PROFILE_UPDATE_LIMIT = 5;
const PROFILE_UPDATE_WINDOW_MS = 5 * 60 * 1000;

interface ProfileUpdateBucket {
  count: number;
  startedAt: number;
}

type PublicUser = Omit<User, 'password' | 'lastPasswordChangedAt'>;

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
    private readonly cache: TtlCacheService,
  ) {}

  async findAll(params: QueryParams): Promise<PaginatedResult<PublicUser>> {
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
        result.items.map((user) => this.toPublicUser(user)),
        result.total,
        page,
        limit,
      );
    }

    const users = await this.userRepository.findAll();
    const safeUsers = users.map((user) => this.toPublicUser(user));

    return applyInMemoryPagination(
      safeUsers
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

  async findById(id: number): Promise<PublicUser> {
    const user = await this.findEntityById(id);
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    return this.toPublicUser(user);
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.userRepository.findByLogin(login);
  }

  async findEntityById(id: number): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async create(dto: CreateUserDto, callerUserId?: number): Promise<PublicUser> {
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
      profession: dto.profession ?? '',
      accountStatus: dto.accountStatus ?? 'active',
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

    return this.toPublicUser(user);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    callerUserId?: number,
  ): Promise<PublicUser> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    const partial: Partial<User> = {
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    if (dto.password) {
      partial.password = await argon2.hash(dto.password);
    }

    const updated = await this.userRepository.update(id, partial);
    if (!updated) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    await this.auditService.log(
      callerUserId ?? id,
      AuditAction.UPDATE,
      'user',
      id,
      `Обновлён пользователь "${updated.login}"`,
    );

    return this.toPublicUser(updated);
  }

  async updateMe(id: number, dto: UpdateMeUserDto): Promise<PublicUser> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    this.consumeProfileUpdateLimit(id);

    const updated = await this.userRepository.update(id, {
      ...dto,
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    await this.auditService.log(
      id,
      AuditAction.UPDATE,
      'user-profile',
      id,
      'Пользователь обновил личные настройки',
    );

    return this.toPublicUser(updated);
  }

  async updatePassword(id: number, password: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    const updated = await this.userRepository.update(id, {
      password: await argon2.hash(password),
      lastPasswordChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!updated) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }
  }

  async remove(id: number, callerUserId?: number): Promise<void> {
    const user = await this.findEntityById(id);
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

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

  private toPublicUser(user: User): PublicUser {
    const {
      password: _password,
      lastPasswordChangedAt: _lastPasswordChangedAt,
      ...safe
    } = user;
    void _password;
    void _lastPasswordChangedAt;
    return safe;
  }

  private consumeProfileUpdateLimit(userId: number): void {
    const key = this.getProfileUpdateCacheKey(userId);
    const now = Date.now();
    const current = this.cache.get<ProfileUpdateBucket>(key);

    if (!current || now - current.startedAt >= PROFILE_UPDATE_WINDOW_MS) {
      this.cache.set<ProfileUpdateBucket>(
        key,
        { count: 1, startedAt: now },
        PROFILE_UPDATE_WINDOW_MS,
      );
      return;
    }

    if (current.count >= PROFILE_UPDATE_LIMIT) {
      const waitMs = Math.max(
        0,
        PROFILE_UPDATE_WINDOW_MS - (now - current.startedAt),
      );
      throw new HttpException(
        `Настройки можно изменять не более ${PROFILE_UPDATE_LIMIT} раз за 5 минут. Повторите попытку через ${formatWaitTime(waitMs)}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.cache.set<ProfileUpdateBucket>(
      key,
      {
        count: current.count + 1,
        startedAt: current.startedAt,
      },
      Math.max(1, PROFILE_UPDATE_WINDOW_MS - (now - current.startedAt)),
    );
  }

  private getProfileUpdateCacheKey(userId: number): string {
    return `user-profile-update:${userId}`;
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
  return toPaginatedResult(
    items.slice(offset, offset + limit),
    items.length,
    page,
    limit,
  );
}

function formatWaitTime(ms: number): string {
  const totalSeconds = Math.max(1, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds} сек.`;
  }

  if (seconds === 0) {
    return `${minutes} мин.`;
  }

  return `${minutes} мин. ${seconds} сек.`;
}
