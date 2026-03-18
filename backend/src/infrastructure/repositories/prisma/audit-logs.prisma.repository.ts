import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import type { IAuditLogRepository, AuditLogFilters } from '@/domain/repositories/audit-log.repository';
import { AuditLog } from '@/domain/models/audit-log.model';
import type { AuditLog as PrismaAuditLog, Prisma } from '@prisma/client';
import type { QueryParams, PaginatedResult } from '@/common/helpers/query.helper';
import { buildDbPagination, buildDbSort, buildPaginatedResult } from '@/common/helpers/query.helper';

@Injectable()
export class AuditLogsPrismaRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      orderBy: { id: 'asc' },
    });
    return rows.map((r) => this.toDomain(r));
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
    params: QueryParams,
    filters?: AuditLogFilters,
  ): Promise<PaginatedResult<AuditLog>> {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.entityId) where.entityId = filters.entityId;
    if (filters?.action) where.action = filters.action;
    if (filters?.from || filters?.to) {
      where.timestamp = {};
      if (filters.from) where.timestamp.gte = new Date(filters.from);
      if (filters.to) where.timestamp.lte = new Date(filters.to);
    }

    if (params.search) {
      const searchFields = params.searchFields ?? [
        'description',
        'entityType',
        'action',
      ];
      where.OR = searchFields.map((field) => ({
        [field]: { contains: params.search, mode: 'insensitive' as const },
      }));
    }

    const pagination = buildDbPagination(params.page, params.limit);
    const sortSpec = buildDbSort(params.sort);
    const orderBy = sortSpec
      ? { [sortSpec.field]: sortSpec.direction }
      : { id: 'desc' as const };

    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return buildPaginatedResult(
      rows.map((r) => this.toDomain(r)),
      total,
      pagination,
    );
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
