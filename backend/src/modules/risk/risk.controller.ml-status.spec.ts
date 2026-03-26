import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RiskController } from './risk.controller';
import { MlClientService } from './ml-client.service';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { ReadModelResponseFactory } from '@/common/read-models/read-model-response.factory';
import { RiskPageReadModelService } from './risk-page-read-model.service';
import { RiskPageProjectionService } from './risk-page-projection.service';

describe('RiskController – getMlStatus', () => {
  let controller: RiskController;
  let mlClient: { health: jest.Mock; modelInfo: jest.Mock; retrain: jest.Mock };
  let configService: { get: jest.Mock };

  beforeEach(async () => {
    mlClient = {
      health: jest.fn(),
      modelInfo: jest.fn(),
      retrain: jest.fn(),
    };

    configService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RiskController],
      providers: [
        { provide: MlClientService, useValue: mlClient },
        { provide: ConfigService, useValue: configService },
        { provide: RISK_ASSESSMENT_SERVICE, useValue: {} },
        { provide: TASK_REPOSITORY, useValue: {} },
        { provide: PROJECT_REPOSITORY, useValue: {} },
        { provide: AUDIT_LOG_REPOSITORY, useValue: {} },
        { provide: ProjectAccessService, useValue: {} },
        { provide: ReadModelResponseFactory, useValue: { normalizeIds: jest.fn() } },
        { provide: RiskPageReadModelService, useValue: {} },
        { provide: RiskPageProjectionService, useValue: {} },
      ],
    }).compile();

    controller = module.get<RiskController>(RiskController);
  });

  it('should return provider, health, and modelInfo when ML service is online', async () => {
    configService.get.mockReturnValue('ml');
    mlClient.health.mockResolvedValue({
      status: 'ok',
      model_loaded: true,
      version: '1.0.0',
    });
    mlClient.modelInfo.mockResolvedValue({
      model_type: 'GradientBoostingRegressor',
      version: '1.0.0',
      trained_at: '2026-03-25T10:00:00',
      sample_size: 5000,
      features: ['difficulty', 'assignee_count'],
      metrics: { cv_rmse_mean: 0.12 },
    });

    const result = await controller.getMlStatus();

    expect(result.provider).toBe('ml');
    expect(result.health).toEqual({
      status: 'ok',
      model_loaded: true,
      version: '1.0.0',
    });
    expect(result.modelInfo?.model_type).toBe('GradientBoostingRegressor');
    expect(result.modelInfo?.features).toHaveLength(2);
  });

  it('should return null health/modelInfo when ML service is unavailable', async () => {
    configService.get.mockReturnValue('stub');
    mlClient.health.mockResolvedValue(null);
    mlClient.modelInfo.mockResolvedValue(null);

    const result = await controller.getMlStatus();

    expect(result.provider).toBe('stub');
    expect(result.health).toBeNull();
    expect(result.modelInfo).toBeNull();
  });

  it('should default provider to stub when RISK_PROVIDER is not set', async () => {
    configService.get.mockReturnValue(undefined);
    mlClient.health.mockResolvedValue(null);
    mlClient.modelInfo.mockResolvedValue(null);

    const result = await controller.getMlStatus();

    expect(result.provider).toBe('stub');
  });

  describe('retrain', () => {
    it('should return retrain result on success', async () => {
      mlClient.retrain.mockResolvedValue({
        status: 'success',
        message: 'Model retrained',
        metrics: { cv_rmse_mean: 0.11 },
      });

      const result = await controller.retrain();

      expect(result.status).toBe('success');
      expect(result.message).toBe('Model retrained');
    });

    it('should return error when ML service is unavailable', async () => {
      mlClient.retrain.mockResolvedValue(null);

      const result = await controller.retrain();

      expect(result.status).toBe('error');
      expect(result.message).toBe('ML service is unavailable');
    });
  });
});
