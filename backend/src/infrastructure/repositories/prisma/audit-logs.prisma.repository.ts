import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type {
  AuditLogListQuery,
  IAuditLogRepository,
} from '@/domain/repositories/audit-log.repository';
import { AuditLog } from '@/domain/models/audit-log.model';
import type { AuditLog as PrismaAuditLog } from '@prisma/client';
import { buildOrderBy, buildStringSearch, getPagination } from './prisma-query.utils';

@Injectable()
export class AuditLogsPrismaRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPage(params: AuditLogListQuery) {
    const { skip, take } = getPagination(params.page, params.limit);
    const where = {
      ...(params.userId !== undefined ? { userId: params.userId } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.entityId !== undefined ? { entityId: params.entityId } : {}),
      ...(params.action ? { action: params.action } : {}),
      ...(params.from || params.to
        ? {
            timestamp: {
              ...(params.from ? { gte: new Date(params.from) } : {}),
              ...(params.to ? { lte: new Date(params.to) } : {}),
            },
          }
        : {}),
      ...buildStringSearch(params.search, ['description', 'entityType', 'action']),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: buildOrderBy(
          params.sort,
          ['id', 'userId', 'action', 'entityType', 'entityId', 'timestamp'],
          'id',
        ),
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async findById(id: number): Promise<AuditLog | null> {
    const row = await this.prisma.auditLog.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEntity(
    entityType: string,
    entityId: number,
  ): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByEntityIds(
    entityType: string,
    entityIds: number[],
  ): Promise<AuditLog[]> {
    if (entityIds.length === 0) return [];
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType, entityId: { in: entityIds } },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByUser(userId: number): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findPaginated(
    params: AuditLogListQuery,
  ) {
    const { skip, take } = getPagination(params.page, params.limit);
    const where = {
      ...(params.userId !== undefined ? { userId: params.userId } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.entityId !== undefined ? { entityId: params.entityId } : {}),
      ...(params.action ? { action: params.action } : {}),
      ...(params.from || params.to
        ? {
            timestamp: {
              ...(params.from ? { gte: new Date(params.from) } : {}),
              ...(params.to ? { lte: new Date(params.to) } : {}),
            },
          }
        : {}),
      ...buildStringSearch(params.search, ['description', 'entityType', 'action']),
    };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: buildOrderBy(
          params.sort,
          ['id', 'userId', 'action', 'entityType', 'entityId', 'timestamp'],
          'id',
        ),
        skip,
        take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  async create(log: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    const row = await this.prisma.auditLog.create({
      data: {
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValue: log.oldValue,
        newValue: log.newValue,
        description: log.description,
      },
    });
    return this.toDomain(row);
  }

  async createMany(logs: Omit<AuditLog, 'id'>[]): Promise<number> {
    if (logs.length === 0) return 0;
    const result = await this.prisma.auditLog.createMany({
      data: logs.map((log) => ({
        userId: log.userId,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        oldValue: log.oldValue,
        newValue: log.newValue,
        description: log.description,
      })),
    });
    return result.count;
  }

  private toDomain(row: PrismaAuditLog): AuditLog {
    return {
      id: row.id,
      userId: row.userId,
      action: row.action as AuditLog['action'],
      entityType: row.entityType,
      entityId: row.entityId,
      oldValue: row.oldValue,
      newValue: row.newValue,
      timestamp: row.timestamp.toISOString(),
      description: row.description,
    };
  }
}
