import { Test } from '@nestjs/testing';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';
import { ProjectsListViewService } from './projects-list-view.service';

const makeProjectRecord = (overrides = {}) => ({
  id: 1,
  teamId: 3,
  name: 'Alpha Project',
  description: 'A test project',
  status: ProjectStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  team: { id: 3, name: 'Dev Team' },
  _count: { members: 4 },
  ...overrides,
});

const makeTaskRecord = (overrides = {}) => ({
  id: 10,
  projectId: 1,
  name: 'Fix login',
  description: 'Auth bug',
  deadline: new Date('2026-04-01T00:00:00.000Z'),
  status: TaskStatus.NEW,
  difficulty: 3,
  createdById: 5,
  createdAt: new Date('2026-01-10T00:00:00.000Z'),
  updatedAt: new Date('2026-03-10T00:00:00.000Z'),
  assignees: [{ userId: 7 }],
  ...overrides,
});

const mockRiskAssessment = {
  assessTask: jest.fn().mockResolvedValue({
    predictedCompletionDate: '2026-04-02T00:00:00.000Z',
    delayProbability: 0.2,
    riskLevel: 'low',
    riskFactors: [],
    recommendation: 'On track',
  }),
  assessProject: jest.fn(),
  assessProjectsBatch: jest.fn().mockResolvedValue({}),
};

const mockProjectAccessService = {
  getVisibleProjectIds: jest.fn().mockResolvedValue([1, 2]),
};

const mockPrisma = {
  project: {
    findMany: jest.fn().mockResolvedValue([makeProjectRecord()]),
    count: jest.fn().mockResolvedValue(1),
  },
  task: {
    findMany: jest.fn().mockResolvedValue([makeTaskRecord()]),
  },
  auditLog: {
    findMany: jest.fn().mockResolvedValue([]),
  },
};

async function buildService() {
  const module = await Test.createTestingModule({
    providers: [
      ProjectsListViewService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: ProjectAccessService, useValue: mockProjectAccessService },
      { provide: RISK_ASSESSMENT_SERVICE, useValue: mockRiskAssessment },
    ],
  }).compile();

  return module.get(ProjectsListViewService);
}

describe('ProjectsListViewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.project.findMany.mockResolvedValue([makeProjectRecord()]);
    mockPrisma.project.count.mockResolvedValue(1);
    mockPrisma.task.findMany.mockResolvedValue([makeTaskRecord()]);
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockProjectAccessService.getVisibleProjectIds.mockResolvedValue([1, 2]);
    mockRiskAssessment.assessTask.mockResolvedValue({
      predictedCompletionDate: '2026-04-02T00:00:00.000Z',
      delayProbability: 0.2,
      riskLevel: 'low',
      riskFactors: [],
      recommendation: 'On track',
    });
  });

  describe('getListView', () => {
    it('returns a paginated list of projects with risk summaries for ADMIN', async () => {
      const service = await buildService();
      const result = await service.getListView({}, 1, AccountRole.ADMIN);

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.items[0].id).toBe(1);
      expect(result.items[0].name).toBe('Alpha Project');
      expect(result.items[0].teamName).toBe('Dev Team');
      expect(result.items[0]).toHaveProperty('riskSummary');
    });

    it('calls getVisibleProjectIds with userId for MEMBER', async () => {
      const service = await buildService();
      await service.getListView({}, 42, AccountRole.MEMBER);

      expect(
        mockProjectAccessService.getVisibleProjectIds,
      ).toHaveBeenCalledWith(42);
    });

    it('does not call getVisibleProjectIds for ADMIN', async () => {
      const service = await buildService();
      await service.getListView({}, 1, AccountRole.ADMIN);

      expect(
        mockProjectAccessService.getVisibleProjectIds,
      ).not.toHaveBeenCalled();
    });

    it('returns empty result immediately when member has no visible projects', async () => {
      mockProjectAccessService.getVisibleProjectIds.mockResolvedValue([]);

      const service = await buildService();
      const result = await service.getListView({}, 99, AccountRole.MEMBER);

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(mockPrisma.project.findMany).not.toHaveBeenCalled();
    });

    it('returns empty items list when database returns no project records', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const service = await buildService();
      const result = await service.getListView({}, 1, AccountRole.ADMIN);

      expect(result.items).toHaveLength(0);
      expect(mockPrisma.task.findMany).not.toHaveBeenCalled();
    });

    it('builds riskSummary with low risk when all tasks have low delay probability', async () => {
      const service = await buildService();
      const result = await service.getListView({}, 1, AccountRole.ADMIN);

      expect(result.items[0].riskSummary.riskLevel).toBe('low');
    });

    it('respects page and limit query params', async () => {
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.project.count.mockResolvedValue(0);

      const service = await buildService();
      const result = await service.getListView(
        { page: 2, limit: 5 },
        1,
        AccountRole.ADMIN,
      );

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });
  });
});
