import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { RiskModule } from '../risk/risk.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [AccessModule, RiskModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
