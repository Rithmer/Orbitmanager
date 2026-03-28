import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RiskPageProjectionService } from './risk-page-projection.service';
import { RiskAssigneeScoringService } from './risk-assignee-scoring.service';
import { MlClientService } from './ml-client.service';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';
import type { RiskPageContext } from './risk-page-read-model.service';
import { TaskStatus } from '@/common/enums/task-status.enum';

const makeMlPredictions = () => ({
  '1': {
    predictedCompletionDate: '2026-04-12T00:00:00.000Z',
    delayProbability: 0.65,
    riskLevel: 'high' as const,
    riskFactors: ['Близкий дедлайн', 'Высокая нагрузка на исполнителей'],
    recommendation: 'Контролируйте ход ежедневно.',
  },
  '2': {
    predictedCompletionDate: '2026-04-20T00:00:00.000Z',
    delayProbability: 0.15,
    riskLevel: 'low' as const,
    riskFactors: [],
    recommendation: 'Задача в зелёной зоне.',
  },
});

const makeContext = (): RiskPageContext => ({
  projectIds: [10],
  projectNamesById: new Map([[10, 'Project Alpha']]),
  tasksByProject: new Map([
    [
      10,
      [
        {
          id: 1,
          projectId: 10,
          name: 'Task A',
          status: 'in_progress',
          difficulty: 4,
          deadline: new Date('2026-04-10'),
          createdAt: new Date('2026-03-01'),
          assigneeIds: [100],
        },
        {
          id: 2,
          projectId: 10,
          name: 'Task B',
          status: 'new',
          difficulty: 2,
          deadline: new Date('2026-05-01'),
          createdAt: new Date('2026-03-10'),
          assigneeIds: [101],
        },
      ],
    ],
  ]),
  membersByProject: new Map([
    [
      10,
      [
        {
          userId: 100,
          role: 'developer',
          fullName: 'Alice',
          profession: 'Backend',
          accountStatus: 'active',
        },
        {
          userId: 101,
          role: 'team_lead',
          fullName: 'Bob',
          profession: 'Lead',
          accountStatus: 'active',
        },
      ],
    ],
  ]),
  inputsByTaskId: new Map([
    [
      1,
      {
        taskId: 1,
        difficulty: 4,
        deadline: '2026-04-10T00:00:00.000Z',
        createdAt: '2026-03-01T00:00:00.000Z',
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 1,
        assigneeLoad: 2,
        statusChangesCount: 1,
        daysSinceCreation: 20,
        daysUntilDeadline: 10,
      },
    ],
    [
      2,
      {
        taskId: 2,
        difficulty: 2,
        deadline: '2026-05-01T00:00:00.000Z',
        createdAt: '2026-03-10T00:00:00.000Z',
        status: TaskStatus.NEW,
        assigneeCount: 1,
        assigneeLoad: 0,
        statusChangesCount: 0,
        daysSinceCreation: 10,
        daysUntilDeadline: 30,
      },
    ],
  ]),
  allInputs: [
    {
      taskId: 1,
      difficulty: 4,
      deadline: '2026-04-10T00:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
      status: TaskStatus.IN_PROGRESS,
      assigneeCount: 1,
      assigneeLoad: 2,
      statusChangesCount: 1,
      daysSinceCreation: 20,
      daysUntilDeadline: 10,
    },
    {
      taskId: 2,
      difficulty: 2,
      deadline: '2026-05-01T00:00:00.000Z',
      createdAt: '2026-03-10T00:00:00.000Z',
      status: TaskStatus.NEW,
      assigneeCount: 1,
      assigneeLoad: 0,
      statusChangesCount: 0,
      daysSinceCreation: 10,
      daysUntilDeadline: 30,
    },
  ],
});

describe('RiskPageProjectionService', () => {
  let service: RiskPageProjectionService;
  let mlClient: { predictBatch: jest.Mock };
  let riskService: { assessTask: jest.Mock };

  const createModule = async (provider: string) => {
    mlClient = { predictBatch: jest.fn() };
    riskService = {
      assessTask: jest.fn().mockResolvedValue({
        predictedCompletionDate: '2026-04-15T00:00:00.000Z',
        delayProbability: 0.3,
        riskLevel: 'medium',
        riskFactors: ['Stub factor'],
        recommendation: 'Stub recommendation',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskPageProjectionService,
        RiskAssigneeScoringService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(provider) },
        },
        { provide: MlClientService, useValue: mlClient },
        { provide: RISK_ASSESSMENT_SERVICE, useValue: riskService },
      ],
    }).compile();

    service = module.get(RiskPageProjectionService);
  };

  describe('stub provider', () => {
    beforeEach(() => createModule('stub'));

    it('uses riskService.assessTask for each task input', async () => {
      const context = makeContext();
      const result = await service.buildProjectsPage(context);

      expect(riskService.assessTask).toHaveBeenCalledTimes(2);
      expect(mlClient.predictBatch).not.toHaveBeenCalled();
      expect(result[10]).toBeDefined();
      expect(result[10].predictionSource).toBe('stub');
    });

    it('preserves legacy fields riskScore/riskLevel/tasksAtRisk/summary', async () => {
      const result = await service.buildProjectsPage(makeContext());
      const project = result[10];

      expect(typeof project.riskScore).toBe('number');
      expect(['low', 'medium', 'high']).toContain(project.riskLevel);
      expect(Array.isArray(project.tasksAtRisk)).toBe(true);
      expect(typeof project.summary).toBe('string');
    });

    it('includes new additive fields', async () => {
      const result = await service.buildProjectsPage(makeContext());
      const project = result[10];

      expect(typeof project.successProbability).toBe('number');
      expect(project.successProbability).toBe(100 - project.riskScore);
      expect(Array.isArray(project.riskFactors)).toBe(true);
      expect(Array.isArray(project.taskInsights)).toBe(true);
      expect(Array.isArray(project.recommendations)).toBe(true);
    });

    it('taskInsights include server-computed fields', async () => {
      const result = await service.buildProjectsPage(makeContext());
      const insight = result[10].taskInsights[0];

      expect(typeof insight.taskSuccessProbability).toBe('number');
      expect(typeof insight.coordinationPenalty).toBe('number');
      expect(Array.isArray(insight.assigneeBreakdown)).toBe(true);
      expect(Array.isArray(insight.recommendedAssignees)).toBe(true);
    });

    it('returns empty dto for project with no tasks', async () => {
      const context = makeContext();
      context.projectIds.push(20);
      context.tasksByProject.set(20, []);
      const result = await service.buildProjectsPage(context);

      expect(result[20].riskScore).toBe(0);
      expect(result[20].riskLevel).toBe('low');
      expect(result[20].successProbability).toBe(100);
      expect(result[20].taskInsights).toHaveLength(0);
    });
  });

  describe('ml provider', () => {
    beforeEach(() => createModule('ml'));

    it('uses MlClientService.predictBatch', async () => {
      mlClient.predictBatch.mockResolvedValue(makeMlPredictions());
      const result = await service.buildProjectsPage(makeContext());

      expect(mlClient.predictBatch).toHaveBeenCalledTimes(1);
      expect(riskService.assessTask).not.toHaveBeenCalled();
      expect(result[10].predictionSource).toBe('ml');
    });

    it('throws 503 when ML returns null', async () => {
      mlClient.predictBatch.mockResolvedValue(null);

      await expect(service.buildProjectsPage(makeContext())).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('includes RISK_ML_UNAVAILABLE code in 503 body', async () => {
      mlClient.predictBatch.mockResolvedValue(null);

      try {
        await service.buildProjectsPage(makeContext());
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ServiceUnavailableException);
        const response = (error as ServiceUnavailableException).getResponse();
        expect(response).toHaveProperty('code', 'RISK_ML_UNAVAILABLE');
      }
    });

    it('computes correct successProbability from ML predictions', async () => {
      mlClient.predictBatch.mockResolvedValue(makeMlPredictions());
      const result = await service.buildProjectsPage(makeContext());
      const project = result[10];

      // avgDelay = (0.65 + 0.15) / 2 = 0.4, riskScore = 40
      expect(project.riskScore).toBe(40);
      expect(project.successProbability).toBe(60);
      expect(project.riskLevel).toBe('medium');
    });

    it('marks high-risk tasks in tasksAtRisk', async () => {
      mlClient.predictBatch.mockResolvedValue(makeMlPredictions());
      const result = await service.buildProjectsPage(makeContext());

      expect(result[10].tasksAtRisk).toHaveLength(1);
      expect(result[10].tasksAtRisk[0].taskId).toBe(1);
      expect(result[10].tasksAtRisk[0].delayProbability).toBe(0.65);
    });
  });

  describe('buildTasksPage', () => {
    beforeEach(() => createModule('stub'));

    it('returns extended task-level DTOs', async () => {
      const context = makeContext();
      const result = await service.buildTasksPage(context, 10);

      expect(Object.keys(result)).toHaveLength(2);
      const task1 = result[1];
      expect(task1).toBeDefined();
      expect(typeof task1.taskSuccessProbability).toBe('number');
      expect(typeof task1.coordinationPenalty).toBe('number');
      expect(Array.isArray(task1.assigneeBreakdown)).toBe(true);
      expect(Array.isArray(task1.recommendedAssignees)).toBe(true);
      expect(typeof task1.predictedCompletionDate).toBe('string');
    });

    it('returns empty for project with no tasks', async () => {
      const context = makeContext();
      const result = await service.buildTasksPage(context, 999);
      expect(result).toEqual({});
    });
  });
});
