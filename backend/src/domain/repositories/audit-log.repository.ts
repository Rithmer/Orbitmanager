import { AuditLog } from '../models/audit-log.model';

export interface IAuditLogRepository {
  findAll(): Promise<AuditLog[]>;
  findById(id: number): Promise<AuditLog | null>;
  create(log: Omit<AuditLog, 'id'>): Promise<AuditLog>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
