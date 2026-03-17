import { Module } from '@nestjs/common';
import { RiskController } from './risk.controller';
import { RiskStubService } from './risk-stub.service';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';

@Module({
  controllers: [RiskController],
  providers: [
    { provide: RISK_ASSESSMENT_SERVICE, useClass: RiskStubService },
  ],
  exports: [RISK_ASSESSMENT_SERVICE],
})
export class RiskModule {}
