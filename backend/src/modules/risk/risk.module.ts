import { Module } from '@nestjs/common';
import { AccessModule } from '@/common/access/access.module';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { RiskController } from './risk.controller';
import { RiskStubService } from './risk-stub.service';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';

@Module({
  imports: [AccessModule],
  controllers: [RiskController],
  providers: [
    AccountRolesGuard,
    { provide: RISK_ASSESSMENT_SERVICE, useClass: RiskStubService },
  ],
  exports: [RISK_ASSESSMENT_SERVICE],
})
export class RiskModule {}
