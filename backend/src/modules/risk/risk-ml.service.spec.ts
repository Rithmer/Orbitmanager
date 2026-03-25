import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RiskMlService } from './risk-ml.service';
import { RiskStubService } from './risk-stub.service';
import { MlClientService } from './ml-client.service';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import type { TaskRiskInput } from '@/domain/services/risk-assessment.interface';
import { TaskStatus } from '@/common/enums/task-status.enum';

const mockInput: TaskRiskInput = {
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

const mockMlPrediction = {
  predictedCompletionDate: '2026-04-12T00:00:00.000Z',
  delayProbability: 0.35,
  riskLevel: 'medium' as const,
  riskFactors: ['Средняя/высокая сложность при близком дедлайне'],
  recommendation: 'Контролируйте ход выполнения задачи ежедневно.',
};

const mockStubResult = {
  predictedCompletionDate: '2026-04-11T00:00:00.000Z',
  delayProbability: 0.25,
  riskLevel: 'low' as const,
  riskFactors: [],
  recommendation: 'Задача находится в зелёной зоне. Продолжайте в текущем режиме.',
};

describe('RiskMlService', () => {
  let service: RiskMlService;
  let mlClient: { predict: jest.Mock; predictBatch: jest.Mock };
  let stubService: { assessTask: jest.Mock; assessProject: jest.Mock; assessProjectsBatch: jest.Mock };
  let taskRepo: { findByProject: jest.Mock; findByProjects: jest.Mock };
  let projectRepo: { findById: jest.Mock };
  let auditLogRepo: { findByEntityIds: jest.Mock };

  beforeEach(async () => {
    mlClient = {
      predict: jest.fn(),
      predictBatch: jest.fn(),
    };

    stubService = {
      assessTask: jest.fn().mockResolvedValue(mockStubResult),
      assessProject: jest.fn().mockResolvedValue({
        riskScore: 15,
        riskLevel: 'low',
        tasksAtRisk: [],
        summary: 'stub fallback',
      }),
      assessProjectsBatch: jest.fn().mockResolvedValue({}),
    };

    taskRepo = {
      findByProject: jest.fn().mockResolvedValue([]),
      findByProjects: jest.fn().mockResolvedValue([]),
    };

    projectRepo = {
      findById: jest.fn(),
    };

    auditLogRepo = {
      findByEntityIds: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskMlService,
        { provide: MlClientService, useValue: mlClient },
        { provide: RiskStubService, useValue: stubService },
        { provide: TASK_REPOSITORY, useValue: taskRepo },
        { provide: PROJECT_REPOSITORY, useValue: projectRepo },
        { provide: AUDIT_LOG_REPOSITORY, useValue: auditLogRepo },
      ],
    }).compile();

    service = module.get<RiskMlService>(RiskMlService);
  });

  describe('assessTask', () => {
    it('should return ML prediction when available', async () => {
      mlClient.predict.mockResolvedValue(mockMlPrediction);

      const result = await service.assessTask(mockInput);

      expect(result.delayProbability).toBe(0.35);
      expect(result.riskLevel).toBe('medium');
      expect(mlClient.predict).toHaveBeenCalledWith(mockInput);
      expect(stubService.assessTask).not.toHaveBeenCalled();
    });

    it('should fallback to stub when ML returns null', async () => {
      mlClient.predict.mockResolvedValue(null);

      const result = await service.assessTask(mockInput);

      expect(result).toEqual(mockStubResult);
      expect(stubService.assessTask).toHaveBeenCalledWith(mockInput);
    });
  });

  describe('assessProject', () => {
    it('should return empty result for project with no active tasks', async () => {
      projectRepo.findById.mockResolvedValue({ id: 1, name: 'Test' });
      taskRepo.findByProject.mockResolvedValue([
        {
          id: 1,
          projectId: 1,
          name: 'Done task',
          status: TaskStatus.DONE,
          difficulty: 3,
          deadline: '2026-04-10',
          createdAt: '2026-03-01',
          assigneeIds: [1],
        },
      ]);

      const result = await service.assessProject(1);

      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe('low');
      expect(result.tasksAtRisk).toEqual([]);
    });

    it('should throw NotFoundException for missing project', async () => {
      projectRepo.findById.mockResolvedValue(null);
      await expect(service.assessProject(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should fallback to stub when ML batch predict fails', async () => {
      projectRepo.findById.mockResolvedValue({ id: 1, name: 'Test' });
      taskRepo.findByProject.mockResolvedValue([
        {
          id: 10,
          projectId: 1,
          name: 'Active task',
          status: TaskStatus.IN_PROGRESS,
          difficulty: 3,
          deadline: '2026-04-10',
          createdAt: '2026-03-01',
          assigneeIds: [1],
        },
      ]);
      mlClient.predictBatch.mockResolvedValue(null);

      await service.assessProject(1);

      expect(stubService.assessProject).toHaveBeenCalledWith(1);
    });
  });

  describe('assessProjectsBatch', () => {
    it('should return empty object for empty project list', async () => {
      const result = await service.assessProjectsBatch([]);
      expect(result).toEqual({});
    });

    it('should fallback to stub when ML is unavailable', async () => {
      taskRepo.findByProjects.mockResolvedValue([
        {
          id: 10,
          projectId: 1,
          name: 'Task',
          status: TaskStatus.IN_PROGRESS,
          difficulty: 3,
          deadline: '2026-04-10',
          createdAt: '2026-03-01',
          assigneeIds: [],
        },
      ]);
      mlClient.predictBatch.mockResolvedValue(null);
      stubService.assessProjectsBatch.mockResolvedValue({
        1: {
          riskScore: 20,
          riskLevel: 'low',
          tasksAtRisk: [],
          summary: 'stub',
        },
      });

      const result = await service.assessProjectsBatch([1]);

      expect(stubService.assessProjectsBatch).toHaveBeenCalledWith([1]);
      expect(result[1]?.riskScore).toBe(20);
    });
  });
});
