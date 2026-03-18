import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AccessModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
