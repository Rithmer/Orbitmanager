import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TtlCacheService } from '@/common/cache/ttl-cache.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import type { Project } from '@/domain/models/project.model';
import { ProjectAccessService } from './project-access.service';

const mockCache = {
  get: jest.fn(),
  set: jest.fn(),
  getOrSet: jest.fn().mockImplementation((_key: string, factory: () => Promise<unknown>) => factory()),
  invalidate: jest.fn(),
  invalidateByPrefix: jest.fn(),
};

const project: Project = {
  id: 10,
  teamId: 1,
  name: 'Project',
  description: '',
  status: ProjectStatus.ACTIVE,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockProjectRepository = {
  findByTeams: jest.fn().mockResolvedValue([project]),
};

const mockProjectMemberRepository = {
  findByUser: jest.fn().mockResolvedValue([]),
  findByUserAndProject: jest.fn().mockResolvedValue(null),
};

const mockTeamMemberRepository = {
  findByUser: jest.fn().mockResolvedValue([]),
  findByUserAndTeam: jest.fn().mockResolvedValue(null),
};

describe('ProjectAccessService', () => {
  let service: ProjectAccessService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectAccessService,
        { provide: PROJECT_REPOSITORY, useValue: mockProjectRepository },
        {
          provide: PROJECT_MEMBER_REPOSITORY,
          useValue: mockProjectMemberRepository,
        },
        { provide: TEAM_MEMBER_REPOSITORY, useValue: mockTeamMemberRepository },
        { provide: TtlCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<ProjectAccessService>(ProjectAccessService);
  });

  it('returns team projects for owner and assigned projects for observer', async () => {
    mockTeamMemberRepository.findByUser.mockResolvedValueOnce([
      { id: 1, userId: 1, teamId: 1, teamRole: TeamRole.OWNER },
      { id: 2, userId: 1, teamId: 2, teamRole: TeamRole.OBSERVER },
    ]);
    mockProjectRepository.findByTeams.mockResolvedValueOnce([
      project,
      { ...project, id: 11, teamId: 2 },
    ]);
    mockProjectMemberRepository.findByUser.mockResolvedValueOnce([
      {
        id: 20,
        userId: 1,
        projectId: 11,
        role: ProjectRole.OBSERVER,
        assignedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const result = await service.getVisibleProjectIds(1);

    expect(result).toEqual([10, 11]);
  });

  it('blocks project visibility when user is outside the team', async () => {
    await expect(service.assertProjectVisibility(project, 99)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('allows observer to access only assigned projects', async () => {
    mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
      id: 2,
      userId: 4,
      teamId: 1,
      teamRole: TeamRole.OBSERVER,
    });
    mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce({
      id: 30,
      userId: 4,
      projectId: 10,
      role: ProjectRole.OBSERVER,
      assignedAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(
      service.assertProjectVisibility(project, 4),
    ).resolves.not.toThrow();
  });

  it('allows project management for team lead', async () => {
    mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
      id: 2,
      userId: 2,
      teamId: 1,
      teamRole: TeamRole.MEMBER,
    });
    mockProjectMemberRepository.findByUserAndProject.mockResolvedValueOnce({
      id: 40,
      userId: 2,
      projectId: 10,
      role: ProjectRole.TEAM_LEAD,
      assignedAt: '2026-01-01T00:00:00.000Z',
    });

    await expect(
      service.assertCanManageProject(project, 2, AccountRole.MEMBER),
    ).resolves.not.toThrow();
  });

  it('blocks team-level administration for non-owner', async () => {
    mockTeamMemberRepository.findByUserAndTeam.mockResolvedValueOnce({
      id: 3,
      userId: 3,
      teamId: 1,
      teamRole: TeamRole.MEMBER,
    });

    await expect(
      service.assertTeamOwnerOrAdmin(3, 1, AccountRole.MEMBER),
    ).rejects.toThrow(ForbiddenException);
  });
});
