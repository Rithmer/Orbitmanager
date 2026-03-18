import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { RiskController } from './risk.controller';
import { RiskStubService } from './risk-stub.service';

@Module({
  imports: [AccessModule],
  controllers: [RiskController],
  providers: [RiskStubService],
  exports: [RiskStubService],
})
export class RiskModule {}
