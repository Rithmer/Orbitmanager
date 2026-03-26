import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AccessModule } from '@/common/access/access.module';

@Module({
  imports: [AuditLogsModule, AccessModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
