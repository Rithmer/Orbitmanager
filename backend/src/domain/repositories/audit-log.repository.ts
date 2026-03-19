import { AuditLog } from '../models/audit-log.model';
import {
  RepositoryPageParams,
  RepositoryPageResult,
} from './paginated-query.types';

export interface AuditLogListQuery extends RepositoryPageParams {
  userId?: number;
  entityType?: string;
  entityId?: number;
  action?: string;
  from?: string;
  to?: string;
}

export interface IAuditLogRepository {
  findAll(): Promise<AuditLog[]>;
  findPage?(
    params: AuditLogListQuery,
  ): Promise<RepositoryPageResult<AuditLog>>;
  findById(id: number): Promise<AuditLog | null>;
  findByEntity(entityType: string, entityId: number): Promise<AuditLog[]>;
  findByEntityIds(
    entityType: string,
    entityIds: number[],
  ): Promise<AuditLog[]>;
  findByUser(userId: number): Promise<AuditLog[]>;
  create(log: Omit<AuditLog, 'id'>): Promise<AuditLog>;
  createMany(logs: Omit<AuditLog, 'id'>[]): Promise<number>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
