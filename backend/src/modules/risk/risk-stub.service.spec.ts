import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createPrismaMock, type PrismaMock } from '@/test-utils/mock-prisma';
import { TaskStatus } from '@/common/enums/task-status.enum';
import type { TaskRiskInput } from './risk.types';
import { RiskStubService } from './risk-stub.service';

describe('RiskStubService', () => {
  let service: RiskStubService;
  let prisma: PrismaMock;

  const now = new Date();
  const isoNow = now.toISOString();
  const futureDate = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const pastDate = new Date(
    now.getTime() - 5 * 24 * 60 * 60 * 1000,
  ).toISOString();

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RiskStubService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<RiskStubService>(RiskStubService);
    jest.clearAllMocks();
  });

  it('returns high risk for overdue task input', async () => {
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
  });

  it('throws not found for missing project', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(null);

    await expect(service.assessProject(999)).rejects.toThrow(NotFoundException);
  });

  it('returns low risk for project without active tasks', async () => {
    prisma.project.findUnique.mockResolvedValueOnce({ id: 1 });
    prisma.task.findMany.mockResolvedValueOnce([
      { id: 1, status: TaskStatus.DONE },
      { id: 2, status: TaskStatus.CANCELLED },
    ]);

    const result = await service.assessProject(1);

    expect(result.riskScore).toBe(0);
    expect(result.riskLevel).toBe('low');
  });

  it('calculates project risk from active tasks', async () => {
    prisma.project.findUnique.mockResolvedValueOnce({ id: 1 });
    prisma.task.findMany.mockResolvedValueOnce([
      {
        id: 1,
        projectId: 1,
        name: 'Overdue task',
        status: TaskStatus.IN_PROGRESS,
        difficulty: 4,
        deadline: new Date(pastDate),
        createdAt: new Date(
          now.getTime() - 15 * 24 * 60 * 60 * 1000,
        ),
        assigneeId: 1,
      },
      {
        id: 2,
        projectId: 1,
        name: 'Safe task',
        status: TaskStatus.NEW,
        difficulty: 1,
        deadline: new Date(futureDate),
        createdAt: now,
        assigneeId: 2,
      },
    ]);
    prisma.auditLog.findMany.mockResolvedValueOnce([]);

    const result = await service.assessProject(1);

    expect(result.riskScore).toBeGreaterThan(0);
    expect(result.tasksAtRisk.length).toBeGreaterThanOrEqual(1);
  });
});
