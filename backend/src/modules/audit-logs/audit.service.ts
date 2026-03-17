import { Injectable, Inject } from '@nestjs/common';
import type { IAuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditLog } from '@/domain/models/audit-log.model';
import {
  QueryHelper,
  QueryParams,
  PaginatedResult,
} from '@/common/helpers/query.helper';

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

    return QueryHelper.apply(
      logs,
      { ...params, searchFields: params.searchFields ?? ['description', 'entityType', 'action'] },
    ) as PaginatedResult<AuditLog>;
  }
}
