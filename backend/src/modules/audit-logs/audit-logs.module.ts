import { Module } from '@nestjs/common';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { AuditLogsController } from './audit-logs.controller';
import { AuditService } from './audit.service';

@Module({
  controllers: [AuditLogsController],
  providers: [AuditService, AccountRolesGuard],
  exports: [AuditService],
})
export class AuditLogsModule {}
