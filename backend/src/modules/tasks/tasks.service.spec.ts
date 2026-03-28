import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { BusinessException } from '@/common/exceptions/business.exception';
import type { Project } from '@/domain/models/project.model';
import type { Task } from '@/domain/models/task.model';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { AuditService } from '../audit-logs/audit.service';
import { TtlCacheService } from '@/common/cache/ttl-cache.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { TasksService } from './tasks.service';

const now = new Date();
const futureISO = new Date(
  now.getTime() + 30 * 24 * 60 * 60 * 1000,
).toISOString();
const pastISO = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
const nowISO = now.toISOString();

const OWNER_ID = 1;
const DEVELOPER_ID = 3;
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
  assigneeIds: [DEVELOPER_ID],
  createdById: OWNER_ID,
  createdAt: nowISO,
  updatedAt: nowISO,
};

const paginatedTasks = {
  items: [mockTask],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

const mockTaskRepository = {
  findAll: jest.fn().mockResolvedValue([mockTask]),
  findById: jest.fn().mockResolvedValue(mockTask),
  findByProject: jest.fn().mockResolvedValue([mockTask]),
  findByProjects: jest.fn().mockResolvedValue([mockTask]),
  findPage: jest.fn().mockResolvedValue(paginatedTasks),
  create: jest
    .fn()
    .mockImplementation((data: Omit<Task, 'id'>) =>
      Promise.resolve({ ...data, id: TASK_ID }),
    ),
  update: jest
    .fn()
    .mockImplementation((_id: number, partial: Partial<Task>) =>
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
  findByUser: jest.fn().mockResolvedValue([]),
  findByProject: jest.fn().mockResolvedValue([]),
  findByUserAndProject: jest.fn().mockResolvedValue(null),
  deleteByProject: jest.fn().mockResolvedValue(undefined),
  deleteByUserAndProjects: jest.fn().mockResolvedValue(undefined),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const mockPrismaTx = {
  task: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  taskAssignee: {
    createMany: jest.fn(),
  },
};

const mockPrismaService = {
  $transaction: jest.fn((fn: (tx: typeof mockPrismaTx) => Promise<unknown>) =>
    fn(mockPrismaTx),
  ),
};

const mockProjectAccessService = {
  getVisibleProjectIds: jest.fn().mockResolvedValue([]),
  assertProjectVisibility: jest.fn().mockResolvedValue(undefined),
  assertTeamOwnerOrProjectLead: jest.fn().mockResolvedValue(undefined),
  hasTeamOwnershipOrProjectLead: jest.fn().mockResolvedValue(false),
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
        {
          provide: PROJECT_MEMBER_REPOSITORY,
          useValue: mockProjectMemberRepository,
        },
        { provide: AuditService, useValue: mockAuditService },
        {
          provide: ProjectAccessService,
          useValue: mockProjectAccessService,
        },
        {
          provide: TtlCacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidateByPrefix: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);

    mockProjectRepository.findById.mockResolvedValue(mockProject);
    mockProjectAccessService.getVisibleProjectIds.mockResolvedValue([]);
    mockProjectAccessService.assertProjectVisibility.mockResolvedValue(
      undefined,
    );
    mockProjectAccessService.assertTeamOwnerOrProjectLead.mockResolvedValue(
      undefined,
    );
    mockProjectAccessService.hasTeamOwnershipOrProjectLead.mockResolvedValue(
      false,
    );
    mockPrismaTx.task.create.mockResolvedValue({
      ...mockTask,
      deadline: new Date(mockTask.deadline),
      createdAt: new Date(mockTask.createdAt),
      updatedAt: new Date(mockTask.updatedAt),
      assignees: [],
    });
    mockPrismaTx.auditLog.create.mockResolvedValue({});
    mockPrismaTx.taskAssignee.createMany.mockResolvedValue({ count: 0 });
    mockPrismaService.$transaction.mockImplementation(
      (fn: (tx: typeof mockPrismaTx) => Promise<unknown>) => fn(mockPrismaTx),
    );
  });

  describe('findAll', () => {
    it('returns all tasks for admin', async () => {
      const result = await service.findAll({}, OWNER_ID, AccountRole.ADMIN);
      expect(result.items).toHaveLength(1);
      expect(mockTaskRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20 }),
      );
    });

    it('loads visible tasks for non-admin user from access service', async () => {
      mockProjectAccessService.getVisibleProjectIds.mockResolvedValueOnce([
        PROJECT_ID,
      ]);
      const result = await service.findAll({}, OWNER_ID, AccountRole.MEMBER);
      expect(result.items).toHaveLength(1);
      expect(mockTaskRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
          projectIds: [PROJECT_ID],
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns task for admin', async () => {
      const result = await service.findById(
        TASK_ID,
        OWNER_ID,
        AccountRole.ADMIN,
      );
      expect(result.id).toBe(TASK_ID);
    });

    it('throws NotFoundException for missing task', async () => {
      mockTaskRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.findById(999, OWNER_ID, AccountRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('delegates access check for non-admin user', async () => {
      mockProjectAccessService.assertProjectVisibility.mockRejectedValueOnce(
        new ForbiddenException(),
      );
      await expect(
        service.findById(TASK_ID, OWNER_ID, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create', () => {
    const createDto = {
      projectId: PROJECT_ID,
      name: 'New Task',
      description: 'desc',
      deadline: futureISO,
      difficulty: 3,
      assigneeIds: undefined,
    };

    it('creates task in transaction when Prisma is available', async () => {
      const result = await service.create(
        createDto,
        OWNER_ID,
        AccountRole.MEMBER,
      );
      expect(result.id).toBe(TASK_ID);
      expect(
        mockProjectAccessService.assertTeamOwnerOrProjectLead,
      ).toHaveBeenCalled();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
      expect(mockPrismaTx.auditLog.create).toHaveBeenCalled();
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when access service blocks creation', async () => {
      mockProjectAccessService.assertTeamOwnerOrProjectLead.mockRejectedValueOnce(
        new ForbiddenException(),
      );
      await expect(
        service.create(createDto, OWNER_ID, AccountRole.MEMBER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws BadRequestException when deadline is in the past', async () => {
      await expect(
        service.create(
          { ...createDto, deadline: pastISO },
          OWNER_ID,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when project does not exist', async () => {
      mockProjectRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.create(createDto, OWNER_ID, AccountRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when assignee is not a project member', async () => {
      mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce(
        null,
      );
      await expect(
        service.create(
          { ...createDto, assigneeIds: [999] },
          OWNER_ID,
          AccountRole.MEMBER,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update status', () => {
    it('changes status via allowed transition', async () => {
      mockProjectAccessService.assertProjectVisibility.mockResolvedValueOnce(
        undefined,
      );
      mockProjectAccessService.hasTeamOwnershipOrProjectLead.mockResolvedValueOnce(
        true,
      );

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

    it('rejects forbidden status transition', async () => {
      mockProjectAccessService.hasTeamOwnershipOrProjectLead.mockResolvedValueOnce(
        true,
      );

      await expect(
        service.update(
          TASK_ID,
          { status: TaskStatus.DONE },
          OWNER_ID,
          AccountRole.ADMIN,
        ),
      ).rejects.toThrow(BusinessException);
    });

    it('allows developer to change status of own task', async () => {
      const devTask: Task = {
        ...mockTask,
        assigneeIds: [DEVELOPER_ID],
        status: TaskStatus.IN_PROGRESS,
      };
      mockTaskRepository.findById.mockResolvedValueOnce(devTask);
      mockTaskRepository.update.mockResolvedValueOnce({
        ...devTask,
        status: TaskStatus.REVIEW,
      });
      mockProjectAccessService.assertProjectVisibility.mockResolvedValueOnce(
        undefined,
      );
      mockProjectAccessService.hasTeamOwnershipOrProjectLead.mockResolvedValueOnce(
        false,
      );
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
  });

  describe('remove', () => {
    it('deletes task for admin', async () => {
      await service.remove(TASK_ID, OWNER_ID, AccountRole.ADMIN);
      expect(mockTaskRepository.delete).toHaveBeenCalledWith(TASK_ID);
    });

    it('throws NotFoundException for missing task', async () => {
      mockTaskRepository.findById.mockResolvedValueOnce(null);
      await expect(
        service.remove(999, OWNER_ID, AccountRole.ADMIN),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
