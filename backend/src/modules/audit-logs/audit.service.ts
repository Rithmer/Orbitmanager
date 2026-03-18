import { Injectable, Inject } from '@nestjs/common';
import type { IAuditLogRepository, AuditLogFilters } from '@/domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditLog } from '@/domain/models/audit-log.model';
import type {
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

  async logMany(
    logs: {
      userId: number;
      action: AuditAction;
      entityType: string;
      entityId: number | null;
      description?: string;
      oldValue?: string | null;
      newValue?: string | null;
    }[],
  ): Promise<void> {
    if (logs.length === 0) return;
    await this.auditLogRepository.createMany(
      logs.map((l) => ({
        userId: l.userId,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        oldValue: l.oldValue ?? null,
        newValue: l.newValue ?? null,
        timestamp: new Date().toISOString(),
        description: l.description ?? '',
      })),
    );
  }

  async findAll(
    params: QueryParams,
    filters?: AuditLogFilters,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.auditLogRepository.findPaginated(params, filters);
  }
}
