import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AccessModule } from '@/common/access/access.module';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { RiskController } from './risk.controller';
import { RiskStubService } from './risk-stub.service';
import { RiskMlService } from './risk-ml.service';
import { MlClientService } from './ml-client.service';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';

@Module({
  imports: [AccessModule, ConfigModule],
  controllers: [RiskController],
  providers: [
    AccountRolesGuard,
    RiskStubService,
    MlClientService,
    {
      provide: RISK_ASSESSMENT_SERVICE,
      useFactory: (
        configService: ConfigService,
        mlService: RiskMlService,
        stubService: RiskStubService,
      ) => {
        const provider = configService.get<string>('RISK_PROVIDER') ?? 'stub';
        if (provider === 'ml') {
          return mlService;
        }
        return stubService;
      },
      inject: [ConfigService, RiskMlService, RiskStubService],
    },
    RiskMlService,
  ],
  exports: [RISK_ASSESSMENT_SERVICE, MlClientService],
})
export class RiskModule {}
