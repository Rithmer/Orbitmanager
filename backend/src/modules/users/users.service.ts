import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma, type User } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import {
  PaginatedResult,
  buildPaginatedResult,
  normalizePagination,
  parseSortField,
} from '@/common/query/pagination';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit-logs/audit.service';
import { AuditAction } from '@/common/enums/audit-action.enum';

type SafeUser = Omit<User, 'password'>;

export interface UsersListParams {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  accountRole?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: UsersListParams): Promise<PaginatedResult<SafeUser>> {
    const pagination = normalizePagination(params.page, params.limit);
    const where = this.buildWhere(params);
    const orderBy = this.buildOrderBy(params.sort);

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return buildPaginatedResult(
      users.map((user) => this.omitPassword(user)),
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(id: number): Promise<SafeUser> {
    const user = await this.findEntityById(id);
    if (!user) {
      throw new NotFoundException(`РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${id} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    return this.omitPassword(user);
  }

  async findByLogin(login: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { login } });
  }

  async findEntityById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(dto: CreateUserDto, callerUserId?: number): Promise<SafeUser> {
    const existing = await this.findByLogin(dto.login);
    if (existing) {
      throw new ConflictException(`Р›РѕРіРёРЅ "${dto.login}" СѓР¶Рµ Р·Р°РЅСЏС‚`);
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        login: dto.login,
        password: hashedPassword,
        fullName: dto.fullName,
        profession: dto.profession,
        accountStatus: 'active',
        accountRole: dto.accountRole ?? AccountRole.MEMBER,
      },
    });

    await this.auditService.log(
      callerUserId ?? user.id,
      AuditAction.CREATE,
      'user',
      user.id,
      `РЎРѕР·РґР°РЅ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ "${user.login}"`,
    );

    return this.omitPassword(user);
  }

  async update(
    id: number,
    dto: UpdateUserDto,
    callerUserId?: number,
  ): Promise<SafeUser> {
    const existing = await this.findEntityById(id);
    if (!existing) {
      throw new NotFoundException(`РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${id} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    const data: Prisma.UserUpdateInput = {
      ...(dto.fullName !== undefined ? { fullName: dto.fullName } : {}),
      ...(dto.profession !== undefined ? { profession: dto.profession } : {}),
      ...(dto.accountRole !== undefined ? { accountRole: dto.accountRole } : {}),
    };

    if (dto.password) {
      data.password = await argon2.hash(dto.password);
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    await this.auditService.log(
      callerUserId ?? id,
      AuditAction.UPDATE,
      'user',
      id,
      `РћР±РЅРѕРІР»С‘РЅ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ "${updated.login}"`,
    );

    return this.omitPassword(updated);
  }

  async remove(id: number, callerUserId?: number): Promise<void> {
    const user = await this.findEntityById(id);
    if (!user) {
      throw new NotFoundException(`РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${id} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    const [createdTeamsCount, createdTasksCount, auditLogsCount] =
      await Promise.all([
        this.prisma.team.count({ where: { createdById: id } }),
        this.prisma.task.count({ where: { createdById: id } }),
        this.prisma.auditLog.count({ where: { userId: id } }),
      ]);

    const blockingDependencies = [
      createdTeamsCount > 0 ? `РєРѕРјР°РЅРґС‹: ${createdTeamsCount}` : null,
      createdTasksCount > 0 ? `Р·Р°РґР°С‡Рё: ${createdTasksCount}` : null,
      auditLogsCount > 0 ? `Р°СѓРґРёС‚: ${auditLogsCount}` : null,
    ].filter(Boolean);

    if (blockingDependencies.length > 0) {
      throw new ConflictException(
        `РќРµР»СЊР·СЏ СѓРґР°Р»РёС‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ #${id}: РµСЃС‚СЊ СЃРІСЏР·Р°РЅРЅС‹Рµ РґР°РЅРЅС‹Рµ (${blockingDependencies.join(', ')})`,
      );
    }

    await this.prisma.user.delete({ where: { id } });

    await this.auditService.log(
      callerUserId ?? id,
      AuditAction.DELETE,
      'user',
      id,
      `РЈРґР°Р»С‘РЅ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ "${user.login}"`,
    );
  }

  private buildWhere(params: UsersListParams): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (params.accountRole) {
      where.accountRole = params.accountRole;
    }

    if (params.search) {
      where.OR = [
        { login: { contains: params.search, mode: 'insensitive' } },
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { profession: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(sort?: string): Prisma.UserOrderByWithRelationInput {
    const { field, direction } = parseSortField(
      sort,
      [
        'id',
        'login',
        'fullName',
        'profession',
        'accountRole',
        'accountStatus',
        'createdAt',
        'updatedAt',
      ],
      'id',
    );

    return { [field]: direction };
  }

  private omitPassword(user: User): SafeUser {
    const { password: _password, ...safe } = user;
    void _password;
    return safe;
  }
}
