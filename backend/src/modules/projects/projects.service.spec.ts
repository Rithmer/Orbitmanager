import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createPrismaMock, type PrismaMock } from '@/test-utils/mock-prisma';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { AuditService } from '../audit-logs/audit.service';
import { ProjectsService } from './projects.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaMock;

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  const mockProjectAccessService = {
    getVisibleProjectIds: jest.fn().mockResolvedValue([1]),
    assertProjectVisibility: jest.fn().mockResolvedValue(undefined),
    assertTeamOwnerOrAdmin: jest.fn().mockResolvedValue(undefined),
    assertCanManageProject: jest.fn().mockResolvedValue(undefined),
  };

  const mockProject = {
    id: 1,
    teamId: 1,
    name: 'Test Project',
    description: 'A test project',
    status: ProjectStatus.ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mockProjectMember = {
    id: 1,
    projectId: 1,
    userId: 10,
    role: ProjectRole.TEAM_LEAD,
    assignedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAuditService },
        {
          provide: ProjectAccessService,
          useValue: mockProjectAccessService,
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    jest.clearAllMocks();
  });

  it('loads all projects for admin', async () => {
    prisma.project.count.mockResolvedValueOnce(1);
    prisma.project.findMany.mockResolvedValueOnce([mockProject]);

    const result = await service.findAll({}, 10, AccountRole.ADMIN);

    expect(result.items).toHaveLength(1);
    expect(prisma.project.findMany).toHaveBeenCalled();
  });

  it('loads only visible projects for non-admin', async () => {
    prisma.project.count.mockResolvedValueOnce(1);
    prisma.project.findMany.mockResolvedValueOnce([mockProject]);

    const result = await service.findAll({}, 10, AccountRole.MEMBER);

    expect(result.items).toHaveLength(1);
    expect(mockProjectAccessService.getVisibleProjectIds).toHaveBeenCalledWith(10);
  });

  it('throws not found for missing project', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(null);

    await expect(service.findById(999, 10, AccountRole.ADMIN)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('creates project for team owner', async () => {
    prisma.team.findUnique.mockResolvedValueOnce({ id: 1 });
    prisma.project.create.mockResolvedValueOnce({ ...mockProject, id: 2 });

    const result = await service.create(
      { teamId: 1, name: 'New Project', description: '' },
      10,
      AccountRole.MEMBER,
    );

    expect(result.id).toBe(2);
    expect(mockProjectAccessService.assertTeamOwnerOrAdmin).toHaveBeenCalled();
  });

  it('throws bad request when adding user outside the team', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    prisma.teamMember.findUnique.mockResolvedValueOnce(null);

    await expect(
      service.addMember(
        1,
        { userId: 99, role: ProjectRole.DEVELOPER },
        10,
        AccountRole.MEMBER,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws conflict when project membership already exists', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    prisma.teamMember.findUnique.mockResolvedValueOnce({
      id: 1,
      userId: 10,
      teamId: 1,
      teamRole: TeamRole.OWNER,
    });
    prisma.projectMember.findUnique.mockResolvedValueOnce(mockProjectMember);

    await expect(
      service.addMember(
        1,
        { userId: 10, role: ProjectRole.DEVELOPER },
        10,
        AccountRole.MEMBER,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('updates project when management is allowed', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    prisma.project.update.mockResolvedValueOnce({ ...mockProject, name: 'Updated' });

    const result = await service.update(1, { name: 'Updated' }, 10, AccountRole.MEMBER);

    expect(result.name).toBe('Updated');
    expect(mockProjectAccessService.assertCanManageProject).toHaveBeenCalled();
  });

  it('clears assignee before removing project member', async () => {
    prisma.projectMember.findUnique.mockResolvedValueOnce(mockProjectMember);
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    prisma.task.updateMany.mockResolvedValueOnce({ count: 1 });
    prisma.projectMember.delete.mockResolvedValueOnce(mockProjectMember);

    await service.removeMember(mockProjectMember.id, 10, AccountRole.MEMBER);

    expect(prisma.task.updateMany).toHaveBeenCalled();
    expect(prisma.projectMember.delete).toHaveBeenCalledWith({
      where: { id: mockProjectMember.id },
    });
  });

  it('propagates forbidden visibility rejection for regular user', async () => {
    prisma.project.findUnique.mockResolvedValueOnce(mockProject);
    mockProjectAccessService.assertProjectVisibility.mockRejectedValueOnce(
      new ForbiddenException(),
    );

    await expect(service.findById(1, 20, AccountRole.MEMBER)).rejects.toThrow(
      ForbiddenException,
    );
  });
});
