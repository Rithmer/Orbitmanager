import { Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditService } from './audit.service';
import { AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log.repository';
import { AuditLogsJsonRepository } from '../../infrastructure/repositories/json/audit-logs.json.repository';

@Module({
  controllers: [AuditLogsController],
  providers: [
    AuditService,
    { provide: AUDIT_LOG_REPOSITORY, useClass: AuditLogsJsonRepository },
  ],
  exports: [AuditService],
})
export class AuditLogsModule {}
