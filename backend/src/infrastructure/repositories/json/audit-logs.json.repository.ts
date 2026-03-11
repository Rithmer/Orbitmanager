import { Injectable } from '@nestjs/common';
import { JsonFileService } from '../../storage/json-file.service';
import type { IAuditLogRepository } from '../../../domain/repositories/audit-log.repository';
import { AuditLog } from '../../../domain/models/audit-log.model';

@Injectable()
export class AuditLogsJsonRepository implements IAuditLogRepository {
  private readonly entity = 'audit_logs';

  constructor(private readonly jsonFileService: JsonFileService) {}

  async findAll(): Promise<AuditLog[]> {
    const data = await this.jsonFileService.read<AuditLog>(this.entity);
    return data.items;
  }

  async findById(id: number): Promise<AuditLog | null> {
    const data = await this.jsonFileService.read<AuditLog>(this.entity);
    return data.items.find((l) => l.id === id) ?? null;
  }

  async findByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    const data = await this.jsonFileService.read<AuditLog>(this.entity);
    return data.items.filter(
      (l) => l.entityType === entityType && l.entityId === entityId,
    );
  }

  async create(log: Omit<AuditLog, 'id'>): Promise<AuditLog> {
    return this.jsonFileService.create<AuditLog>(this.entity, log);
  }
}
