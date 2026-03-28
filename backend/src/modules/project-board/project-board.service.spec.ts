import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';
import { ProjectBoardService } from './project-board.service';

const makeUserRecord = (id: number, login: string) => ({
  id,
  login,
  fullName: `User ${login}`,
  profession: 'Engineer',
});

const makeMemberRecord = (overrides = {}) => ({
  id: 20,
  userId: 7,
  role: 'owner',
  assignedAt: new Date('2026-01-01T00:00:00.000Z'),
  user: makeUserRecord(7, 'alice'),
  ...overrides,
});

const makeTaskRecord = (overrides = {}) => ({
  id: 10,
  projectId: 1,
  name: 'Fix authentication',
  description: 'Auth bug fix',
  deadline: new Date('2026-04-01T00:00:00.000Z'),
  status: TaskStatus.NEW,
  difficulty: 3,
  createdById: 5,
  createdAt: new Date('2026-01-10T00:00:00.000Z'),
  updatedAt: new Date('2026-03-10T00:00:00.000Z'),
  assignees: [
    {
      userId: 7,
      user: makeUserRecord(7, 'alice'),
    },
  ],
  ...overrides,
});

const makeProjectRecord = (overrides = {}) => ({
  id: 1,
  teamId: 3,
  name: 'Alpha Project',
  description: 'A test project',
  status: ProjectStatus.ACTIVE,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-03-01T00:00:00.000Z'),
  members: [makeMemberRecord()],
  tasks: [makeTaskRecord()],
  ...overrides,
});

const mockRiskAssessmentService = {
  assessTask: jest.fn().mockResolvedValue({
    predictedCompletionDate: '2026-04-02T00:00:00.000Z',
    delayProbability: 0.15,
    riskLevel: 'low',
    riskFactors: [],
    recommendation: 'On track',
  }),
  assessProject: jest.fn(),
  assessProjectsBatch: jest.fn().mockResolvedValue({}),
};

const mockProjectAccessService = {
  assertProjectVisibility: jest.fn().mockResolvedValue(undefined),
};

const mockPrisma = {
  project: {
    findUnique: jest.fn().mockResolvedValue(makeProjectRecord()),
  },
  auditLog: {
    findMany: jest.fn().mockResolvedValue([]),
  },
};

async function buildService() {
  const module = await Test.createTestingModule({
    providers: [
      ProjectBoardService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: ProjectAccessService, useValue: mockProjectAccessService },
      { provide: RISK_ASSESSMENT_SERVICE, useValue: mockRiskAssessmentService },
    ],
  }).compile();

  return module.get(ProjectBoardService);
}

describe('ProjectBoardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.project.findUnique.mockResolvedValue(makeProjectRecord());
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockProjectAccessService.assertProjectVisibility.mockResolvedValue(
      undefined,
    );
    mockRiskAssessmentService.assessTask.mockResolvedValue({
      predictedCompletionDate: '2026-04-02T00:00:00.000Z',
      delayProbability: 0.15,
      riskLevel: 'low',
      riskFactors: [],
      recommendation: 'On track',
    });
  });

  describe('getBoardView', () => {
    it('returns the board with project, members, tasks and risk map for ADMIN', async () => {
      const service = await buildService();
      const result = await service.getBoardView(1, 1, AccountRole.ADMIN);

      expect(result.project.id).toBe(1);
      expect(result.project.name).toBe('Alpha Project');
      expect(result.members).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe(10);
      expect(result.riskByTaskId).toHaveProperty('10');
    });

    it('returns the board for a MEMBER when access check passes', async () => {
      const service = await buildService();
      const result = await service.getBoardView(1, 7, AccountRole.MEMBER);

      expect(result.project.id).toBe(1);
      expect(
        mockProjectAccessService.assertProjectVisibility,
      ).toHaveBeenCalledTimes(1);
    });

    it('passes userId to assertProjectVisibility for non-admin users', async () => {
      const service = await buildService();
      await service.getBoardView(1, 42, AccountRole.MEMBER);

      expect(
        mockProjectAccessService.assertProjectVisibility,
      ).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }), 42);
    });

    it('skips assertProjectVisibility for ADMIN', async () => {
      const service = await buildService();
      await service.getBoardView(1, 1, AccountRole.ADMIN);

      expect(
        mockProjectAccessService.assertProjectVisibility,
      ).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const service = await buildService();
      await expect(
        service.getBoardView(999, 1, AccountRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns a board with empty tasks and empty riskByTaskId when project has no tasks', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(
        makeProjectRecord({ tasks: [] }),
      );

      const service = await buildService();
      const result = await service.getBoardView(1, 1, AccountRole.ADMIN);

      expect(result.tasks).toHaveLength(0);
      expect(result.riskByTaskId).toEqual({});
      expect(mockRiskAssessmentService.assessTask).not.toHaveBeenCalled();
    });

    it('maps task assignees into both assignees array and assigneeIds', async () => {
      const service = await buildService();
      const result = await service.getBoardView(1, 1, AccountRole.ADMIN);

      const task = result.tasks[0];
      expect(task.assigneeIds).toEqual([7]);
      expect(task.assignees).toHaveLength(1);
      expect(task.assignees[0].id).toBe(7);
    });

    it('invokes assessTask once per task to build riskByTaskId', async () => {
      const service = await buildService();
      await service.getBoardView(1, 1, AccountRole.ADMIN);

      expect(mockRiskAssessmentService.assessTask).toHaveBeenCalledTimes(1);
    });
  });
});
