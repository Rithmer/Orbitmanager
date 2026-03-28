import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TaskStatus } from '@/common/enums/task-status.enum';
import type { TaskRiskInput } from '@/domain/services/risk-assessment.interface';
import { MlClientService } from './ml-client.service';

describe('MlClientService', () => {
  let service: MlClientService;
  let fetchSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MlClientService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              if (key === 'ML_SERVICE_URL') return 'http://ml-test:8000';
              return undefined;
            },
          },
        },
      ],
    }).compile();

    service = module.get<MlClientService>(MlClientService);
    fetchSpy = jest.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('predict', () => {
    it('should return prediction on success', async () => {
      const mockPrediction = {
        predictedCompletionDate: '2026-04-12T00:00:00.000Z',
        delayProbability: 0.45,
        riskLevel: 'medium',
        riskFactors: ['test factor'],
        recommendation: 'test recommendation',
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ prediction: mockPrediction }),
      } as Response);

      const input: TaskRiskInput = {
        taskId: 1,
        difficulty: 3,
        deadline: '2026-04-10T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 2,
        assigneeLoad: 3,
        statusChangesCount: 1,
        daysSinceCreation: 10,
        daysUntilDeadline: 15,
      };

      const result = await service.predict(input);

      expect(result).toEqual(mockPrediction);
      expect(fetchSpy).toHaveBeenCalledWith(
        'http://ml-test:8000/predict',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should return null on network error', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.predict({
        taskId: 1,
        difficulty: 2,
        deadline: '2026-04-10T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        status: TaskStatus.NEW,
        assigneeCount: 1,
        assigneeLoad: 1,
        statusChangesCount: 0,
        daysSinceCreation: 2,
        daysUntilDeadline: 10,
      });

      expect(result).toBeNull();
    });

    it('should return null on non-OK response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 503,
      } as Response);

      const result = await service.predict({
        taskId: 2,
        difficulty: 4,
        deadline: '2026-04-15T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 2,
        assigneeLoad: 2,
        statusChangesCount: 2,
        daysSinceCreation: 5,
        daysUntilDeadline: 12,
      });

      expect(result).toBeNull();
    });
  });

  describe('predictBatch', () => {
    it('should return predictions on success', async () => {
      const mockPredictions = {
        '1': {
          predictedCompletionDate: '2026-04-12T00:00:00.000Z',
          delayProbability: 0.45,
          riskLevel: 'medium',
          riskFactors: [],
          recommendation: 'test',
        },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ predictions: mockPredictions }),
      } as Response);

      const result = await service.predictBatch([
        {
          taskId: 1,
          difficulty: 3,
          deadline: '2026-04-10T00:00:00.000Z',
          createdAt: '2026-03-01T00:00:00.000Z',
          status: TaskStatus.IN_PROGRESS,
          assigneeCount: 2,
          assigneeLoad: 3,
          statusChangesCount: 1,
          daysSinceCreation: 10,
          daysUntilDeadline: 15,
        },
      ]);

      expect(result).toEqual(mockPredictions);
    });

    it('should return null on failure', async () => {
      fetchSpy.mockRejectedValue(new Error('timeout'));

      const result = await service.predictBatch([
        {
          taskId: 3,
          difficulty: 1,
          deadline: '2026-05-01T00:00:00.000Z',
          createdAt: '2026-03-01T00:00:00.000Z',
          status: TaskStatus.NEW,
          assigneeCount: 1,
          assigneeLoad: 0,
          statusChangesCount: 0,
          daysSinceCreation: 1,
          daysUntilDeadline: 30,
        },
      ]);

      expect(result).toBeNull();
    });
  });

  describe('retrain', () => {
    it('should return retrain result on success', async () => {
      const mockResult = {
        status: 'success',
        message: 'Model retrained',
        metrics: { cv_rmse_mean: 0.12 },
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResult),
      } as Response);

      const result = await service.retrain();

      expect(result).toEqual(mockResult);
    });

    it('should return null on failure', async () => {
      fetchSpy.mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await service.retrain();

      expect(result).toBeNull();
    });
  });

  describe('health', () => {
    it('should return health on success', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            status: 'ok',
            model_loaded: true,
            version: '1.0.0',
          }),
      } as Response);

      const result = await service.health();

      expect(result?.status).toBe('ok');
    });

    it('should return null on failure', async () => {
      fetchSpy.mockRejectedValue(new Error('timeout'));

      const result = await service.health();

      expect(result).toBeNull();
    });
  });
});
