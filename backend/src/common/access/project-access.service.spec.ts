import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createPrismaMock, type PrismaMock } from '@/test-utils/mock-prisma';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { ProjectAccessService } from './project-access.service';

describe('ProjectAccessService', () => {
  let service: ProjectAccessService;
  let prisma: PrismaMock;

  const project = {
    id: 10,
    teamId: 1,
    name: 'Project',
    description: '',
    status: 'active',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAccessService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProjectAccessService>(ProjectAccessService);
    jest.clearAllMocks();
  });

  it('returns all team projects for owner and assigned observer projects', async () => {
    prisma.teamMember.findMany.mockResolvedValueOnce([
      { id: 1, userId: 1, teamId: 1, teamRole: TeamRole.OWNER },
      { id: 2, userId: 1, teamId: 2, teamRole: TeamRole.OBSERVER },
    ]);
    prisma.project.findMany.mockResolvedValueOnce([
      project,
      { ...project, id: 11, teamId: 2 },
    ]);
    prisma.projectMember.findMany.mockResolvedValueOnce([{ projectId: 11 }]);

    const result = await service.getVisibleProjectIds(1);

    expect(result).toEqual([10, 11]);
  });

  it('blocks visibility when user is outside the team', async () => {
    prisma.teamMember.findUnique.mockResolvedValueOnce(null);

    await expect(service.assertProjectVisibility(project, 99)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows observer to access only assigned projects', async () => {
    prisma.teamMember.findUnique.mockResolvedValueOnce({
      id: 2,
      userId: 4,
      teamId: 1,
      teamRole: TeamRole.OBSERVER,
    });
    prisma.projectMember.findUnique.mockResolvedValueOnce({
      id: 30,
      userId: 4,
      projectId: 10,
      role: ProjectRole.OBSERVER,
      assignedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(
      service.assertProjectVisibility(project, 4),
    ).resolves.not.toThrow();
  });

  it('allows project management for team lead', async () => {
    prisma.teamMember.findUnique.mockResolvedValueOnce({
      id: 2,
      userId: 2,
      teamId: 1,
      teamRole: TeamRole.MEMBER,
    });
    prisma.projectMember.findUnique.mockResolvedValueOnce({
      id: 40,
      userId: 2,
      projectId: 10,
      role: ProjectRole.TEAM_LEAD,
      assignedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await expect(
      service.assertCanManageProject(project, 2, AccountRole.MEMBER),
    ).resolves.not.toThrow();
  });
});
