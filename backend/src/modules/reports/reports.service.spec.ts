import { Test } from '@nestjs/testing';
import { AccountRole } from '@/common/enums/account-role.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { InMemoryCacheService } from '@/common/cache/in-memory-cache.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ReportsService } from './reports.service';

const mockPrisma = {
  project: {
    findMany: jest.fn().mockResolvedValue([
      { id: 1, name: 'Project 1' },
      { id: 2, name: 'Project 2' },
    ]),
  },
  task: {
    count: jest.fn().mockImplementation(async ({ where }: { where?: Record<string, unknown> }) => {
      const status = where?.['status'];
      if (status === TaskStatus.DONE) return 1;
      if (status === TaskStatus.IN_PROGRESS) return 1;
      if (status === TaskStatus.NEW) return 2;
      return 4;
    }),
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
        { projectId: 2, status: TaskStatus.IN_PROGRESS, _count: { _all: 1 } },
        { projectId: 2, status: TaskStatus.NEW, _count: { _all: 1 } },
      ];
    }),
  },
};

const mockProjectAccessService = {
  getVisibleProjectIds: jest.fn().mockResolvedValue([1, 2]),
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
        { provide: ProjectAccessService, useValue: mockProjectAccessService },
      ],
    }).compile();

    const service = module.get(ReportsService);
    const result = await service.getSummary(1, AccountRole.MEMBER);

    expect(result.overview.totalTasks).toBe(4);
    expect(result.statusDistribution).toHaveLength(4);
    expect(result.projectTaskBreakdown.length).toBeGreaterThan(0);
  });
});
