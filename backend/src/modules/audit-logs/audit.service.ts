import { Injectable } from '@nestjs/common';
import { AuditAction } from '@/common/enums/audit-action.enum';
import {
  PaginatedResult,
  buildPaginatedResult,
  normalizePagination,
  parseSortField,
} from '@/common/query/pagination';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type { AuditLog, Prisma } from '@prisma/client';

export interface AuditLogListParams {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: number,
    action: AuditAction,
    entityType: string,
    entityId: number | null,
    description?: string,
    oldValue?: string | null,
    newValue?: string | null,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldValue: oldValue ?? null,
        newValue: newValue ?? null,
        timestamp: new Date(),
        description: description ?? '',
      },
    });
  }

  async findAll(
    params: AuditLogListParams,
  ): Promise<PaginatedResult<AuditLog>> {
    const pagination = normalizePagination(params.page, params.limit);
    const where = this.buildWhere(params);
    const orderBy = this.buildOrderBy(params.sort);

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return buildPaginatedResult(
      items,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  private buildWhere(params: AuditLogListParams): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {};

    if (params.userId !== undefined) {
      where.userId = params.userId;
    }
    if (params.entityType) {
      where.entityType = params.entityType;
    }
    if (params.entityId !== undefined) {
      where.entityId = params.entityId;
    }
    if (params.action) {
      where.action = params.action;
    }
    if (params.from || params.to) {
      where.timestamp = {
        ...(params.from ? { gte: new Date(params.from) } : {}),
        ...(params.to ? { lte: new Date(params.to) } : {}),
      };
    }
    if (params.search) {
      where.OR = [
        { description: { contains: params.search, mode: 'insensitive' } },
        { entityType: { contains: params.search, mode: 'insensitive' } },
        { action: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(
    sort?: string,
  ): Prisma.AuditLogOrderByWithRelationInput {
    const { field, direction } = parseSortField(
      sort,
      ['id', 'userId', 'action', 'entityType', 'entityId', 'timestamp'],
      'id',
    );

    return { [field]: direction };
  }
}
