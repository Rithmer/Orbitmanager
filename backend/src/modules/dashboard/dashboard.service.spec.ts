import { Test } from '@nestjs/testing';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { InMemoryCacheService } from '@/common/cache/in-memory-cache.service';
import { RISK_ASSESSMENT_SERVICE, type IRiskAssessmentService } from '@/domain/services/risk-assessment.interface';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { DashboardService } from './dashboard.service';

const mockPrisma = {
  project: {
    count: jest.fn().mockResolvedValue(2),
    findMany: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
  },
  task: {
    count: jest
      .fn()
      .mockImplementation(async ({ where }: { where?: Record<string, unknown> }) => {
        const status = where?.['status'];
        if (status === TaskStatus.DONE) return 1;
        if (status === TaskStatus.IN_PROGRESS) return 1;
        return 2;
      }),
    findMany: jest.fn().mockImplementation(async ({ take }: { take?: number }) => {
      if (take === 6) {
        return [
          {
            id: 10,
            projectId: 1,
            name: 'Task 10',
            description: '',
            deadline: new Date(Date.now() + 86_400_000),
            status: TaskStatus.NEW,
            difficulty: 3,
            createdById: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            project: { name: 'Project 1' },
            assignees: [{ userId: 20, user: { fullName: 'User 20' } }],
          },
        ];
      }

      return [
        {
          id: 10,
          projectId: 1,
          name: 'Task 10',
          description: '',
          deadline: new Date(Date.now() + 86_400_000),
          status: TaskStatus.NEW,
          difficulty: 3,
          createdById: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          project: { name: 'Project 1' },
          assignees: [{ userId: 20 }],
        },
      ];
    }),
  },
  auditLog: {
    findMany: jest.fn().mockResolvedValue([{ entityId: 10, action: AuditAction.STATUS_CHANGE }]),
  },
};

const mockProjectAccessService = {
  getVisibleProjectIds: jest.fn().mockResolvedValue([1, 2]),
};

const mockRiskService: IRiskAssessmentService = {
  assessTask: jest.fn().mockResolvedValue({
    predictedCompletionDate: new Date().toISOString(),
    delayProbability: 0.7,
    riskLevel: 'high',
    riskFactors: [],
    recommendation: 'Check',
  }),
  assessProject: jest.fn(),
  assessProjectsBatch: jest.fn().mockResolvedValue({}),
};

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached dashboard summary with risk insights', async () => {
    const module = await Test.createTestingModule({
      providers: [
        DashboardService,
        InMemoryCacheService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProjectAccessService, useValue: mockProjectAccessService },
        { provide: RISK_ASSESSMENT_SERVICE, useValue: mockRiskService },
      ],
    }).compile();

    const service = module.get(DashboardService);
    const result = await service.getSummary(1, AccountRole.MEMBER);

    expect(result.overview.projectCount).toBe(2);
    expect(result.recentTasks).toHaveLength(1);
    expect(result.riskInsights).toHaveLength(1);
  });
});
