import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type {
  IUserRepository,
  UserListQuery,
} from '@/domain/repositories/user.repository';
import { User } from '@/domain/models/user.model';
import type { User as PrismaUser } from '@prisma/client';
import { buildOrderBy, buildStringSearch, getPagination } from './prisma-query.utils';

@Injectable()
export class UsersPrismaRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    const rows = await this.prisma.user.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findPage(params: UserListQuery) {
    const { skip, take } = getPagination(params.page, params.limit);
    const where = {
      ...(params.accountRole ? { accountRole: params.accountRole } : {}),
      ...buildStringSearch(params.search, ['login', 'fullName', 'profession']),
    };

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: buildOrderBy(
          params.sort,
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
        ),
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByLogin(login: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { login } });
    return row ? this.toDomain(row) : null;
  }

  async create(user: Omit<User, 'id'>): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        login: user.login,
        password: user.password,
        fullName: user.fullName,
        profession: user.profession,
        accountStatus: user.accountStatus,
        accountRole: user.accountRole,
        avatarUrl: user.avatarUrl,
      },
    });
    return this.toDomain(row);
  }

  async update(id: number, partial: Partial<User>): Promise<User | null> {
    const {
      id: _id,
      createdAt: _ca,
      updatedAt: _ua,
      ...data
    } = partial as Record<string, unknown>;
    try {
      const row = await this.prisma.user.update({ where: { id }, data });
      return this.toDomain(row);
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return null;
      throw e;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.prisma.user.delete({ where: { id } });
      return true;
    } catch (e: unknown) {
      const prismaError = e as { code?: string };
      if (prismaError.code === 'P2025') return false;
      throw e;
    }
  }

  private toDomain(row: PrismaUser): User {
    return {
      id: row.id,
      login: row.login,
      password: row.password,
      fullName: row.fullName,
      profession: row.profession,
      accountStatus: row.accountStatus as User['accountStatus'],
      accountRole: row.accountRole as User['accountRole'],
      avatarUrl: row.avatarUrl ?? null,
      lastPasswordChangedAt: row.lastPasswordChangedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
