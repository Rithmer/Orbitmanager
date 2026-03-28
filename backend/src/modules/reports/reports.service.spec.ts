import { Test } from '@nestjs/testing';
import { AccountRole } from '@/common/enums/account-role.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { InMemoryCacheService } from '@/common/cache/in-memory-cache.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ReportsService } from './reports.service';

const mockPrisma = {
  teamMember: {
    findMany: jest
      .fn()
      .mockResolvedValue([{ teamId: 1, teamRole: TeamRole.OWNER }]),
  },
  projectMember: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  project: {
    findMany: jest.fn().mockResolvedValue([
      { id: 1, name: 'Project 1', teamId: 1 },
      { id: 2, name: 'Project 2', teamId: 2 },
    ]),
  },
  task: {
    count: jest
      .fn()
      .mockImplementation(
        async ({ where }: { where?: Record<string, unknown> }) => {
          const status = where?.['status'];
          if (status === TaskStatus.DONE) return 1;
          if (status === TaskStatus.IN_PROGRESS) return 1;
          if (status === TaskStatus.REVIEW) return 1;
          if (status === TaskStatus.NEW) return 2;
          return 4;
        },
      ),
    groupBy: jest.fn().mockImplementation(async ({ by }: { by: string[] }) => {
      if (by.includes('difficulty')) {
        return [
          { difficulty: 2, _count: { _all: 1 } },
          { difficulty: 3, _count: { _all: 1 } },
        ];
      }

      return [
        { projectId: 1, status: TaskStatus.DONE, _count: { _all: 1 } },
        { projectId: 1, status: TaskStatus.NEW, _count: { _all: 1 } },
        { projectId: 1, status: TaskStatus.REVIEW, _count: { _all: 1 } },
        { projectId: 2, status: TaskStatus.IN_PROGRESS, _count: { _all: 1 } },
        { projectId: 2, status: TaskStatus.NEW, _count: { _all: 1 } },
      ];
    }),
  },
};

describe('ReportsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns summary aggregates and chart data', async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportsService,
        InMemoryCacheService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    const service = module.get(ReportsService);
    const result = await service.getSummary(1, AccountRole.MEMBER);

    expect(result.overview.totalTasks).toBe(4);
    expect(
      result.statusDistribution.some((s) => s.label === 'Тестирование'),
    ).toBe(true);
    expect(result.statusDistribution.length).toBeGreaterThanOrEqual(4);
    expect(result.projectTaskBreakdown.length).toBeGreaterThan(0);
  });

  it('returns accessible projects with team ids', async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReportsService,
        InMemoryCacheService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    const service = module.get(ReportsService);
    const result = await service.getAccessibleProjects(1, AccountRole.MEMBER);

    expect(result).toEqual([
      { id: 1, name: 'Project 1', teamId: 1 },
      { id: 2, name: 'Project 2', teamId: 2 },
    ]);
  });
});
