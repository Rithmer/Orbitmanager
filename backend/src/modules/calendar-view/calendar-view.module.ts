import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { CalendarViewController } from './calendar-view.controller';
import { CalendarViewService } from './calendar-view.service';

@Module({
  imports: [AccessModule],
  controllers: [CalendarViewController],
  providers: [CalendarViewService],
})
export class CalendarViewModule {}
