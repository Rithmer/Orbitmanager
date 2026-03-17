import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import { AuditService } from '../audit-logs/audit.service';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { AccountRole } from '@/common/enums/account-role.enum';
import type { Task } from '@/domain/models/task.model';
import type { Project } from '@/domain/models/project.model';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { BusinessException } from '@/common/exceptions/business.exception';

const now = new Date();
const futureISO = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
const pastISO = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
const nowISO = now.toISOString();

const OWNER_ID = 1;
const TEAM_LEAD_ID = 2;
const DEVELOPER_ID = 3;
const OBSERVER_ID = 4;
const TEAM_ID = 10;
const PROJECT_ID = 20;
const TASK_ID = 30;

const mockProject: Project = {
  id: PROJECT_ID,
  teamId: TEAM_ID,
  name: 'Test Project',
  description: '',
  status: ProjectStatus.ACTIVE,
  createdAt: nowISO,
  updatedAt: nowISO,
};

const mockTask: Task = {
  id: TASK_ID,
  projectId: PROJECT_ID,
  name: 'Test Task',
  description: '',
  deadline: futureISO,
  status: TaskStatus.NEW,
  difficulty: 3,
  assigneeId: DEVELOPER_ID,
  createdById: OWNER_ID,
  createdAt: nowISO,
  updatedAt: nowISO,
};

const mockTaskRepository = {
  findAll: jest.fn().mockResolvedValue([mockTask]),
  findById: jest.fn().mockResolvedValue(mockTask),
  findByProject: jest.fn().mockResolvedValue([mockTask]),
  findByProjects: jest.fn().mockResolvedValue([mockTask]),
  create: jest.fn().mockImplementation((data: Omit<Task, 'id'>) =>
    Promise.resolve({ ...data, id: TASK_ID }),
  ),
  update: jest.fn().mockImplementation((_id: number, partial: Partial<Task>) =>
    Promise.resolve({ ...mockTask, ...partial }),
  ),
  delete: jest.fn().mockResolvedValue(true),
};

const mockProjectRepository = {
  findAll: jest.fn().mockResolvedValue([mockProject]),
  findById: jest.fn().mockResolvedValue(mockProject),
  findByTeam: jest.fn().mockResolvedValue([mockProject]),
  findByTeams: jest.fn().mockResolvedValue([mockProject]),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockProjectMemberRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findByProject: jest.fn().mockResolvedValue([]),
  findByUserAndProject: jest.fn().mockResolvedValue(null),
  deleteByProject: jest.fn().mockResolvedValue(undefined),
  deleteByUserAndProjects: jest.fn().mockResolvedValue(undefined),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockTeamMemberRepository = {
  findAll: jest.fn().mockResolvedValue([]),
  findByTeam: jest.fn().mockResolvedValue([]),
  findByUser: jest.fn().mockResolvedValue([]),
  findByUserAndTeam: jest.fn().mockResolvedValue(null),
  findById: jest.fn().mockResolvedValue(null),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        { provide: PROJECT_MEMBER_REPOSITORY, useValue: mockProjectMemberRepository },
        { provide: TEAM_MEMBER_REPOSITORY, useValue: mockTeamMemberRepository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  // ────────────── findAll ──────────────

  describe('findAll', () => {
    it('should return all tasks for admin', async () => {
      const result = await service.findAll({}, OWNER_ID, AccountRole.ADMIN);
      expect(result.items).toHaveLength(1);
      expect(mockTaskRepository.findAll).toHaveBeenCalled();
    });

    it('should filter visible tasks for non-admin user', async () => {
      // owner of team sees all tasks
      mockTeamMemberRepository.findByUser.mockResolvedValueOnce([
        { id: 1, userId: OWNER_ID, teamId: TEAM_ID, teamRole: TeamRole.OWNER },
      ]);
      mockProjectRepository.findByTeams.mockResolvedValueOnce([mockProject]);
      mockTaskRepository.findByProjects.mockResolvedValueOnce([mockTask]);

      const result = await service.findAll({}, OWNER_ID, AccountRole.MEMBER);
      expect(result.items).toHaveLength(1);
    });
  });

  // ────────────── findById ──────────────

  describe('findById', () => {
    it('should return task for admin', async () => {
      const result = await service.findById(TASK_ID, OWNER_ID, AccountRole.ADMIN);
      expect(result.id).toBe(TASK_ID);
    });

    it('should throw NotFoundException for missing task', async () => {
      mockTaskRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.findById(999, OWNER_ID, AccountRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────── БП1: create ──────────────

  describe('create (БП1)', () => {
    const createDto = {
      projectId: PROJECT_ID,
      name: 'New Task',
      description: 'desc',
      deadline: futureISO,
      difficulty: 3,
      assigneeId: undefined,
    };

    it('should create task when user is team owner', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        id: 1,
        userId: OWNER_ID,
        teamId: TEAM_ID,
        teamRole: TeamRole.OWNER,
      });

      const result = await service.create(createDto, OWNER_ID, AccountRole.MEMBER);
      expect(result.id).toBe(TASK_ID);
      expect(result.status).toBe(TaskStatus.NEW);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should create task when user is team_lead', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        id: 2,
        userId: TEAM_LEAD_ID,
        teamId: TEAM_ID,
        teamRole: TeamRole.MEMBER,
      });
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce({
        id: 1,
        projectId: PROJECT_ID,
        userId: TEAM_LEAD_ID,
        role: ProjectRole.TEAM_LEAD,
        assignedAt: nowISO,
      });

      const result = await service.create(
        { ...createDto },
        TEAM_LEAD_ID,
        AccountRole.MEMBER,
      );
      expect(result.id).toBe(TASK_ID);
    });

    it('should throw ForbiddenException when user is developer (not team_lead)', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        id: 3,
        userId: DEVELOPER_ID,
        teamId: TEAM_ID,
        teamRole: TeamRole.MEMBER,
      });
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce({
        id: 2,
        projectId: PROJECT_ID,
        userId: DEVELOPER_ID,
        role: ProjectRole.DEVELOPER,
        assignedAt: nowISO,
      });

      await expect(
        service.create(createDto, DEVELOPER_ID, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when deadline is in the past', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        id: 1,
        userId: OWNER_ID,
        teamId: TEAM_ID,
        teamRole: TeamRole.OWNER,
      });

      await expect(
        service.create(
          { ...createDto, deadline: pastISO },
          OWNER_ID,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when project does not exist', async () => {
      mockProjectRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.create(createDto, OWNER_ID, AccountRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when assignee is not project member', async () => {
      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        id: 1,
        userId: OWNER_ID,
        teamId: TEAM_ID,
        teamRole: TeamRole.OWNER,
      });
      // assignee check will return null
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce(null);

      await expect(
        service.create(
          { ...createDto, assigneeId: 999 },
          OWNER_ID,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ────────────── БП2: статусы задач ──────────────

  describe('update status (БП2)', () => {
    it('should change status via allowed transition (new → in_progress)', async () => {
      // First call: assertTaskVisibility; second call: assertCanChangeStatus
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce({ id: 1, userId: OWNER_ID, teamId: TEAM_ID, teamRole: TeamRole.OWNER })
        .mockResolvedValueOnce({ id: 1, userId: OWNER_ID, teamId: TEAM_ID, teamRole: TeamRole.OWNER });

      const result = await service.update(
        TASK_ID,
        { status: TaskStatus.IN_PROGRESS },
        OWNER_ID,
        AccountRole.MEMBER,
      );
      expect(result.status).toBe(TaskStatus.IN_PROGRESS);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        OWNER_ID,
        'status_change',
        'task',
        TASK_ID,
        expect.any(String),
        TaskStatus.NEW,
        TaskStatus.IN_PROGRESS,
      );
    });

    it('should reject forbidden status transition (new → done)', async () => {
      // First call: assertTaskVisibility; second call: assertCanChangeStatus
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce({ id: 1, userId: OWNER_ID, teamId: TEAM_ID, teamRole: TeamRole.OWNER })
        .mockResolvedValueOnce({ id: 1, userId: OWNER_ID, teamId: TEAM_ID, teamRole: TeamRole.OWNER });

      await expect(
        service.update(
          TASK_ID,
          { status: TaskStatus.DONE },
          OWNER_ID,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('should allow developer to change status of their own task', async () => {
      const devTask: Task = { ...mockTask, assigneeId: DEVELOPER_ID, status: TaskStatus.IN_PROGRESS };
      mockTaskRepository.findById.mockResolvedValueOnce(devTask);
      mockTaskRepository.update.mockResolvedValueOnce({ ...devTask, status: TaskStatus.REVIEW });

      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        id: 3,
        userId: DEVELOPER_ID,
        teamId: TEAM_ID,
        teamRole: TeamRole.MEMBER,
      });
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce({
        id: 2,
        projectId: PROJECT_ID,
        userId: DEVELOPER_ID,
        role: ProjectRole.DEVELOPER,
        assignedAt: nowISO,
      });

      const result = await service.update(
        TASK_ID,
        { status: TaskStatus.REVIEW },
        DEVELOPER_ID,
        AccountRole.MEMBER,
      );
      expect(result.status).toBe(TaskStatus.REVIEW);
    });

    it('should reject developer trying to change status of another persons task', async () => {
      const otherTask: Task = { ...mockTask, assigneeId: 999, status: TaskStatus.IN_PROGRESS };
      mockTaskRepository.findById.mockResolvedValueOnce(otherTask);

      mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
        id: 3,
        userId: DEVELOPER_ID,
        teamId: TEAM_ID,
        teamRole: TeamRole.MEMBER,
      });
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce({
        id: 2,
        projectId: PROJECT_ID,
        userId: DEVELOPER_ID,
        role: ProjectRole.DEVELOPER,
        assignedAt: nowISO,
      });

      await expect(
        service.update(
          TASK_ID,
          { status: TaskStatus.REVIEW },
          DEVELOPER_ID,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should audit status_change with oldValue and newValue', async () => {
      // First call: assertTaskVisibility; second call: assertCanChangeStatus
      mockTeamMemberRepository.findByUserAndTeam
        .mockResolvedValueOnce({ id: 1, userId: OWNER_ID, teamId: TEAM_ID, teamRole: TeamRole.OWNER })
        .mockResolvedValueOnce({ id: 1, userId: OWNER_ID, teamId: TEAM_ID, teamRole: TeamRole.OWNER });

      await service.update(
        TASK_ID,
        { status: TaskStatus.IN_PROGRESS },
        OWNER_ID,
        AccountRole.MEMBER,
      );

      expect(mockAuditService.log).toHaveBeenCalledWith(
        OWNER_ID,
        'status_change',
        'task',
        TASK_ID,
        expect.stringContaining(''),
        TaskStatus.NEW,
        TaskStatus.IN_PROGRESS,
      );
    });
  });

  // ────────────── remove ──────────────

  describe('remove', () => {
    it('should delete task when user is admin', async () => {
      await service.remove(TASK_ID, OWNER_ID, AccountRole.ADMIN);
      expect(mockTaskRepository.delete).toHaveBeenCalledWith(TASK_ID);
    });

    it('should throw NotFoundException for missing task', async () => {
      mockTaskRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.remove(999, OWNER_ID, AccountRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ────────────── validateStatusTransition ──────────────

  describe('status transition map (ALLOWED_TASK_TRANSITIONS)', () => {
    const cases: [TaskStatus, TaskStatus, boolean][] = [
      [TaskStatus.NEW, TaskStatus.IN_PROGRESS, true],
      [TaskStatus.NEW, TaskStatus.CANCELLED, true],
      [TaskStatus.NEW, TaskStatus.DONE, false],
      [TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, true],
      [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED, true],
      [TaskStatus.IN_PROGRESS, TaskStatus.DONE, false],
      [TaskStatus.REVIEW, TaskStatus.DONE, true],
      [TaskStatus.REVIEW, TaskStatus.IN_PROGRESS, true],
      [TaskStatus.REVIEW, TaskStatus.NEW, false],
      [TaskStatus.DONE, TaskStatus.NEW, false],
      [TaskStatus.CANCELLED, TaskStatus.NEW, true],
      [TaskStatus.CANCELLED, TaskStatus.IN_PROGRESS, false],
    ];

    it.each(cases)(
      'transition %s → %s should be %s',
      async (from, to, expected) => {
        const task: Task = { ...mockTask, status: from, assigneeId: null };
        mockTaskRepository.findById.mockResolvedValueOnce(task);
        mockTaskRepository.update.mockResolvedValueOnce({ ...task, status: to });

        // Use ADMIN to skip permission checks and test only transition logic
        const promise = service.update(TASK_ID, { status: to }, OWNER_ID, AccountRole.ADMIN);

        if (expected) {
          await expect(promise).resolves.toBeDefined();
        } else {
          await expect(promise).rejects.toThrow(BusinessException);
        }
      },
    );
  });
});
