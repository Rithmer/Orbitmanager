import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RiskStubService } from './risk-stub.service';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { TaskStatus } from '@/common/enums/task-status.enum';
import type { TaskRiskInput } from '@/domain/services/risk-assessment.interface';
import type { Task } from '@/domain/models/task.model';

const now = new Date();
const isoNow = now.toISOString();
const futureDate = new Date(
  now.getTime() + 30 * 24 * 60 * 60 * 1000,
).toISOString();
const pastDate = new Date(
  now.getTime() - 5 * 24 * 60 * 60 * 1000,
).toISOString();
const nearDate = new Date(
  now.getTime() + 1 * 24 * 60 * 60 * 1000,
).toISOString();

const mockTaskRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByProject: jest.fn(),
  findByProjects: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockProjectRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByTeam: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockAuditLogRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findById: jest.fn(),
  findByEntityIds: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
};

describe('RiskStubService', () => {
  let service: RiskStubService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskStubService,
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        { provide: AUDIT_LOG_REPOSITORY, useValue: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<RiskStubService>(RiskStubService);
  });

  // ────────────── assessTask ──────────────

  describe('assessTask', () => {
    it('should return high risk when deadline has passed', async () => {
      const input: TaskRiskInput = {
        taskId: 1,
        difficulty: 3,
        deadline: pastDate,
        createdAt: new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 1,
        assigneeLoad: 2,
        statusChangesCount: 1,
        daysSinceCreation: 10,
        daysUntilDeadline: -5,
      };

      const result = await service.assessTask(input);
      expect(result.delayProbability).toBe(0.95);
      expect(result.riskLevel).toBe('high');
      expect(result.riskFactors).toContain('Дедлайн уже прошёл');
    });

    it('should return high risk when ≤2 days until deadline and not on review', async () => {
      const input: TaskRiskInput = {
        taskId: 2,
        difficulty: 3,
        deadline: nearDate,
        createdAt: new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 1,
        assigneeLoad: 2,
        statusChangesCount: 0,
        daysSinceCreation: 10,
        daysUntilDeadline: 1,
      };

      const result = await service.assessTask(input);
      expect(result.delayProbability).toBe(0.7);
      expect(result.riskLevel).toBe('high');
      expect(result.riskFactors).toContain(
        'До дедлайна менее 2 дней, задача не на ревью',
      );
    });

    it('should return medium risk when difficulty ≥ 4 and high assignee load', async () => {
      const input: TaskRiskInput = {
        taskId: 3,
        difficulty: 4,
        deadline: futureDate,
        createdAt: isoNow,
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 1,
        assigneeLoad: 7,
        statusChangesCount: 0,
        daysSinceCreation: 0,
        daysUntilDeadline: 30,
      };

      const result = await service.assessTask(input);
      expect(result.delayProbability).toBe(0.6);
      expect(result.riskLevel).toBe('medium');
      expect(result.riskFactors).toContain('Высокая сложность задачи');
      expect(result.riskFactors).toContain(
        'Высокая нагрузка на исполнителя (более 5 задач)',
      );
    });

    it('should return medium risk when difficulty ≥ 3 and ≤5 days until deadline', async () => {
      const nearish = new Date(
        now.getTime() + 4 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const input: TaskRiskInput = {
        taskId: 4,
        difficulty: 3,
        deadline: nearish,
        createdAt: new Date(
          now.getTime() - 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 1,
        assigneeLoad: 2,
        statusChangesCount: 0,
        daysSinceCreation: 5,
        daysUntilDeadline: 4,
      };

      const result = await service.assessTask(input);
      expect(result.delayProbability).toBe(0.4);
      expect(result.riskLevel).toBe('medium');
    });

    it('should return low risk for easy tasks with plenty of time', async () => {
      const input: TaskRiskInput = {
        taskId: 5,
        difficulty: 1,
        deadline: futureDate,
        createdAt: isoNow,
        status: TaskStatus.NEW,
        assigneeCount: 1,
        assigneeLoad: 1,
        statusChangesCount: 0,
        daysSinceCreation: 0,
        daysUntilDeadline: 30,
      };

      const result = await service.assessTask(input);
      // 0.1 + 1 * 0.05 = 0.15
      expect(result.delayProbability).toBe(0.15);
      expect(result.riskLevel).toBe('low');
    });

    it('should add risk factor for unassigned task', async () => {
      const input: TaskRiskInput = {
        taskId: 6,
        difficulty: 2,
        deadline: futureDate,
        createdAt: isoNow,
        status: TaskStatus.NEW,
        assigneeCount: 0,
        assigneeLoad: 0,
        statusChangesCount: 0,
        daysSinceCreation: 0,
        daysUntilDeadline: 30,
      };

      const result = await service.assessTask(input);
      expect(result.riskFactors).toContain('Задача не назначена исполнителю');
    });

    it('should add risk factor for frequent status changes', async () => {
      const input: TaskRiskInput = {
        taskId: 7,
        difficulty: 2,
        deadline: futureDate,
        createdAt: isoNow,
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 1,
        assigneeLoad: 1,
        statusChangesCount: 5,
        daysSinceCreation: 0,
        daysUntilDeadline: 30,
      };

      const result = await service.assessTask(input);
      expect(result.riskFactors).toContain(
        'Частые изменения статуса (возможная нестабильность)',
      );
    });

    it('should return predictedCompletionDate and recommendation', async () => {
      const input: TaskRiskInput = {
        taskId: 8,
        difficulty: 3,
        deadline: futureDate,
        createdAt: isoNow,
        status: TaskStatus.IN_PROGRESS,
        assigneeCount: 1,
        assigneeLoad: 2,
        statusChangesCount: 0,
        daysSinceCreation: 0,
        daysUntilDeadline: 30,
      };

      const result = await service.assessTask(input);
      expect(result.predictedCompletionDate).toBeDefined();
      expect(typeof result.recommendation).toBe('string');
      expect(result.recommendation.length).toBeGreaterThan(0);
    });
  });

  // ────────────── assessProject ──────────────

  describe('assessProject', () => {
    it('should throw NotFoundException for non-existent project', async () => {
      mockProjectRepository.findById.mockResolvedValue(null);

      await expect(service.assessProject(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return low risk for project with no active tasks', async () => {
      mockProjectRepository.findById.mockResolvedValue({
        id: 1,
        teamId: 1,
        name: 'Test',
      });
      mockTaskRepository.findByProject.mockResolvedValue([
        { id: 1, status: TaskStatus.DONE },
        { id: 2, status: TaskStatus.CANCELLED },
      ]);

      const result = await service.assessProject(1);
      expect(result.riskScore).toBe(0);
      expect(result.riskLevel).toBe('low');
      expect(result.tasksAtRisk).toHaveLength(0);
      expect(result.summary).toContain('нет активных задач');
    });

    it('should calculate project risk from active tasks', async () => {
      mockProjectRepository.findById.mockResolvedValue({
        id: 1,
        teamId: 1,
        name: 'Test',
      });

      const tasks: Partial<Task>[] = [
        {
          id: 1,
          projectId: 1,
          name: 'Overdue task',
          status: TaskStatus.IN_PROGRESS,
          difficulty: 4,
          deadline: pastDate,
          createdAt: new Date(
            now.getTime() - 15 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          assigneeId: 1,
        },
        {
          id: 2,
          projectId: 1,
          name: 'Safe task',
          status: TaskStatus.NEW,
          difficulty: 1,
          deadline: futureDate,
          createdAt: isoNow,
          assigneeId: 2,
        },
      ];

      mockTaskRepository.findByProject.mockResolvedValue(tasks);
      mockTaskRepository.findAll.mockResolvedValue(tasks);
      mockAuditLogRepository.findAll.mockResolvedValue([]);

      const result = await service.assessProject(1);
      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.tasksAtRisk.length).toBeGreaterThanOrEqual(1);
      expect(result.summary).toBeTruthy();
    });

    it('should sort tasksAtRisk by delayProbability descending', async () => {
      mockProjectRepository.findById.mockResolvedValue({
        id: 1,
        teamId: 1,
        name: 'Test',
      });

      const tasks: Partial<Task>[] = [
        {
          id: 1,
          projectId: 1,
          name: 'Medium risk',
          status: TaskStatus.IN_PROGRESS,
          difficulty: 3,
          deadline: new Date(
            now.getTime() + 4 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          createdAt: new Date(
            now.getTime() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          assigneeId: 1,
        },
        {
          id: 2,
          projectId: 1,
          name: 'High risk',
          status: TaskStatus.IN_PROGRESS,
          difficulty: 4,
          deadline: pastDate,
          createdAt: new Date(
            now.getTime() - 10 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          assigneeId: 2,
        },
      ];

      mockTaskRepository.findByProject.mockResolvedValue(tasks);
      mockTaskRepository.findAll.mockResolvedValue(tasks);
      mockAuditLogRepository.findAll.mockResolvedValue([]);

      const result = await service.assessProject(1);

      if (result.tasksAtRisk.length >= 2) {
        expect(result.tasksAtRisk[0].delayProbability).toBeGreaterThanOrEqual(
          result.tasksAtRisk[1].delayProbability,
        );
      }
    });
  });

  // ────────────── assessProjectsBatch ──────────────

  describe('assessProjectsBatch', () => {
    it('should return empty object for empty projectIds', async () => {
      const result = await service.assessProjectsBatch([]);
      expect(result).toEqual({});
      expect(mockTaskRepository.findByProjects).not.toHaveBeenCalled();
    });

    it('should return low risk for projects with no active tasks', async () => {
      mockTaskRepository.findByProjects.mockResolvedValueOnce([
        { id: 1, projectId: 1, status: TaskStatus.DONE },
        { id: 2, projectId: 1, status: TaskStatus.CANCELLED },
      ]);

      const result = await service.assessProjectsBatch([1]);
      expect(result[1]).toBeDefined();
      expect(result[1].riskScore).toBe(0);
      expect(result[1].riskLevel).toBe('low');
      expect(result[1].tasksAtRisk).toHaveLength(0);
      expect(mockTaskRepository.findByProjects).toHaveBeenCalledWith([1]);
    });

    it('should return risk for multiple projects', async () => {
      const tasks: Partial<Task>[] = [
        {
          id: 1,
          projectId: 1,
          name: 'Overdue',
          status: TaskStatus.IN_PROGRESS,
          difficulty: 4,
          deadline: pastDate,
          createdAt: new Date(
            now.getTime() - 15 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          assigneeId: 1,
        },
        {
          id: 2,
          projectId: 2,
          name: 'Safe',
          status: TaskStatus.NEW,
          difficulty: 1,
          deadline: futureDate,
          createdAt: isoNow,
          assigneeId: 2,
        },
      ];
      mockTaskRepository.findByProjects.mockResolvedValueOnce(tasks);

      const result = await service.assessProjectsBatch([1, 2]);
      expect(result[1]).toBeDefined();
      expect(result[2]).toBeDefined();
      expect(Object.keys(result)).toHaveLength(2);
    });
  });
});
