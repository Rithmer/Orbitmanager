import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createPrismaMock, type PrismaMock } from '@/test-utils/mock-prisma';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { BusinessException } from '@/common/exceptions/business.exception';
import { AuditService } from '../audit-logs/audit.service';
import { TasksService } from './tasks.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaMock;

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockProjectAccessService = {
    getVisibleProjectIds: jest.fn().mockResolvedValue([20]),
    assertProjectVisibility: jest.fn().mockResolvedValue(undefined),
    assertTeamOwnerOrProjectLead: jest.fn().mockResolvedValue(undefined),
    hasTeamOwnershipOrProjectLead: jest.fn().mockResolvedValue(false),
  };

  const now = new Date();
  const futureISO = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const pastISO = new Date(
    now.getTime() - 5 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const mockProject = {
    id: 20,
    teamId: 10,
    name: 'Test Project',
    description: '',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  const mockTask = {
    id: 30,
    projectId: 20,
    name: 'Test Task',
    description: '',
    deadline: new Date(futureISO),
    status: TaskStatus.NEW,
    difficulty: 3,
    assigneeId: 3,
    createdById: 1,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAuditService },
        {
          provide: ProjectAccessService,
          useValue: mockProjectAccessService,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  it('returns all tasks for admin', async () => {
    prisma.task.count.mockResolvedValueOnce(1);
    prisma.task.findMany.mockResolvedValueOnce([mockTask]);

    const result = await service.findAll({}, 1, AccountRole.ADMIN);

    expect(result.items).toHaveLength(1);
    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it('loads visible tasks for non-admin user', async () => {
    prisma.task.count.mockResolvedValueOnce(1);
    prisma.task.findMany.mockResolvedValueOnce([mockTask]);

    const result = await service.findAll({}, 1, AccountRole.MEMBER);

    expect(result.items).toHaveLength(1);
    expect(mockProjectAccessService.getVisibleProjectIds).toHaveBeenCalledWith(1);
  });

  it('throws not found for missing task', async () => {
    prisma.task.findUnique.mockResolvedValueOnce(null);

    await expect(service.findById(999, 1, AccountRole.ADMIN)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates task when access is allowed', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    prisma.task.create.mockResolvedValueOnce(mockTask);

    const result = await service.create(
      {
        projectId: 20,
        name: 'New Task',
        description: 'desc',
        deadline: futureISO,
        difficulty: 3,
      },
      1,
      AccountRole.MEMBER,
    );

    expect(result.id).toBe(30);
    expect(mockProjectAccessService.assertTeamOwnerOrProjectLead).toHaveBeenCalled();
  });

  it('rejects past deadline on create', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);

    await expect(
      service.create(
        {
          projectId: 20,
          name: 'Late Task',
          description: 'desc',
          deadline: pastISO,
          difficulty: 3,
        },
        1,
        AccountRole.MEMBER,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects invalid assignee on create', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    prisma.projectMember.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.create(
        {
          projectId: 20,
          name: 'Task',
          description: 'desc',
          deadline: futureISO,
          difficulty: 3,
          assigneeId: 999,
        },
        1,
        AccountRole.MEMBER,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('changes status via allowed transition', async () => {
    prisma.task.findUnique.mockResolvedValueOnce(mockTask);
    prisma.project.findUnique
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockProject);
    mockProjectAccessService.hasTeamOwnershipOrProjectLead.mockResolvedValueOnce(true);
    prisma.task.update.mockResolvedValueOnce({
      ...mockTask,
      status: TaskStatus.IN_PROGRESS,
    });

    const result = await service.update(
      30,
      { status: TaskStatus.IN_PROGRESS },
      1,
      AccountRole.MEMBER,
    );

    expect(result.status).toBe(TaskStatus.IN_PROGRESS);
    expect(mockAuditService.log).toHaveBeenCalled();
  });

  it('rejects forbidden status transition', async () => {
    prisma.task.findUnique.mockResolvedValueOnce(mockTask);
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    mockProjectAccessService.hasTeamOwnershipOrProjectLead.mockResolvedValueOnce(true);

    await expect(
      service.update(
        30,
        { status: TaskStatus.DONE },
        1,
        AccountRole.ADMIN,
      ),
    ).rejects.toThrow(BusinessException);
  });

  it('allows developer to change status of own task', async () => {
    prisma.task.findUnique.mockResolvedValueOnce({
      ...mockTask,
      assigneeId: 3,
      status: TaskStatus.IN_PROGRESS,
    });
    prisma.project.findUnique
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockProject);
    mockProjectAccessService.hasTeamOwnershipOrProjectLead.mockResolvedValueOnce(false);
    prisma.projectMember.findUnique.mockResolvedValueOnce({
      id: 2,
      projectId: 20,
      userId: 3,
      role: ProjectRole.DEVELOPER,
      assignedAt: now,
    });
    prisma.task.update.mockResolvedValueOnce({
      ...mockTask,
      status: TaskStatus.REVIEW,
      assigneeId: 3,
    });

    const result = await service.update(
      30,
      { status: TaskStatus.REVIEW },
      3,
      AccountRole.MEMBER,
    );

    expect(result.status).toBe(TaskStatus.REVIEW);
  });

  it('blocks status change without rights', async () => {
    prisma.task.findUnique.mockResolvedValueOnce(mockTask);
    prisma.project.findUnique
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockProject);
    mockProjectAccessService.hasTeamOwnershipOrProjectLead.mockResolvedValueOnce(false);
    prisma.projectMember.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.update(
        30,
        { status: TaskStatus.IN_PROGRESS },
        99,
        AccountRole.MEMBER,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('deletes task when access is allowed', async () => {
    prisma.task.findUnique.mockResolvedValueOnce(mockTask);
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    prisma.task.delete.mockResolvedValueOnce(mockTask);

    await service.remove(30, 1, AccountRole.ADMIN);

    expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 30 } });
  });
});
