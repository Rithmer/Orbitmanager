import { AuditLog } from '../models/audit-log.model';
import type { PaginatedResult, QueryParams } from '@/common/helpers/query.helper';

export interface AuditLogFilters {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
  from?: string;
  to?: string;
}

export interface IAuditLogRepository {
  findAll(): Promise<AuditLog[]>;
  findById(id: number): Promise<AuditLog | null>;
  findByEntity(entityType: string, entityId: number): Promise<AuditLog[]>;
  findByEntityIds(
    entityType: string,
    entityIds: number[],
  ): Promise<AuditLog[]>;
  findByUser(userId: number): Promise<AuditLog[]>;
  findPaginated(
    params: QueryParams,
    filters?: AuditLogFilters,
  ): Promise<PaginatedResult<AuditLog>>;
  create(log: Omit<AuditLog, 'id'>): Promise<AuditLog>;
  createMany(logs: Omit<AuditLog, 'id'>[]): Promise<number>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
