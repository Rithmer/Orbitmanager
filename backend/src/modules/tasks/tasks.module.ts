import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [AuditLogsModule, AccessModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}
