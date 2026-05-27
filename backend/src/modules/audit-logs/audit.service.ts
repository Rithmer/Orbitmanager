import { Injectable, Inject } from '@nestjs/common';
import type { IAuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditLog } from '@/domain/models/audit-log.model';
import { QueryParams, PaginatedResult } from '@/common/helpers/query.helper';

@Injectable()
export class AuditService {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  async log(
    userId: number,
    action: AuditAction,
    entityType: string,
    entityId: number | null,
    description?: string,
    oldValue?: string | null,
    newValue?: string | null,
  ): Promise<void> {
    await this.auditLogRepository.create({
      userId,
      action,
      entityType,
      entityId,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      timestamp: new Date().toISOString(),
      description: description ?? '',
    });
  }

  async logMany(
    entries: Array<{
      userId: number;
      action: AuditAction;
      entityType: string;
      entityId: number | null;
      description?: string;
      oldValue?: string | null;
      newValue?: string | null;
    }>,
  ): Promise<void> {
    await Promise.all(
      entries.map((e) =>
        this.log(
          e.userId,
          e.action,
          e.entityType,
          e.entityId,
          e.description,
          e.oldValue,
          e.newValue,
        ),
      ),
    );
  }

  async findAll(
    params: QueryParams,
    filters?: {
      userId?: number;
      entityType?: string;
      entityId?: number;
      action?: string;
      from?: string;
      to?: string;
    },
  ): Promise<PaginatedResult<AuditLog>> {
    const page = normalizePage(params.page);
    const limit = normalizeLimit(params.limit);

    if (this.auditLogRepository.findPage) {
      const result = await this.auditLogRepository.findPage({
        page,
        limit,
        search: params.search,
        sort: params.sort,
        ...filters,
      });

      return toPaginatedResult(result.items, result.total, page, limit);
    }

    let logs = await this.auditLogRepository.findAll();

    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }
    if (filters?.entityType) {
      logs = logs.filter((l) => l.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      logs = logs.filter((l) => l.entityId === filters.entityId);
    }
    if (filters?.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }
    if (filters?.from) {
      logs = logs.filter((l) => l.timestamp >= filters.from!);
    }
    if (filters?.to) {
      logs = logs.filter((l) => l.timestamp <= filters.to!);
    }

    return applyInMemoryPagination(
      logs.filter((log) => {
        if (!params.search) {
          return true;
        }

        const search = params.search.toLowerCase();
        return [log.description, log.entityType, log.action].some((field) =>
          field.toLowerCase().includes(search),
        );
      }),
      page,
      limit,
    );
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
