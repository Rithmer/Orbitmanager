import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IAuditLogRepository } from '../../../domain/repositories/audit-log.repository';
import { AuditLog } from '../../../domain/models/audit-log.model';
import type { AuditLog as PrismaAuditLog } from '@prisma/client';

@Injectable()
export class AuditLogsPrismaRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({ orderBy: { id: 'asc' } });
    return rows.map(this.toDomain);
  }

  async findById(id: number): Promise<AuditLog | null> {
    const row = await this.prisma.auditLog.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { id: 'asc' },
    });
    return rows.map(this.toDomain);
  }

  async findByUser(userId: number): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
    return rows.map(this.toDomain);
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
