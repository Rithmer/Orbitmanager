import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ProjectRolesGuard } from './project-roles.guard';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import { ProjectRole } from '../enums/project-role.enum';
import { TeamRole } from '../enums/team-role.enum';
import { AccountRole } from '../enums/account-role.enum';
import { ProjectStatus } from '../enums/project-status.enum';
import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator';

const PROJECT_ID = 5;
const TEAM_ID = 10;
const USER_ID = 1;

const mockProject = {
  id: PROJECT_ID,
  teamId: TEAM_ID,
  name: 'Test Project',
  description: '',
  status: ProjectStatus.ACTIVE,
  deadline: '2030-01-01T00:00:00.000Z',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const makeMockContext = (
  user: unknown,
  params: Record<string, string>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as unknown as ExecutionContext;

describe('ProjectRolesGuard', () => {
  let guard: ProjectRolesGuard;
  let reflector: Reflector;
  let projectMemberRepo: { findByUserAndProject: jest.Mock };
  let teamMemberRepo: { findByUserAndTeam: jest.Mock };
  let projectRepo: { findById: jest.Mock };

  const buildModule = async (requiredRoles: ProjectRole[] | undefined) => {
    projectMemberRepo = { findByUserAndProject: jest.fn() };
    teamMemberRepo = { findByUserAndTeam: jest.fn() };
    projectRepo = { findById: jest.fn().mockResolvedValue(mockProject) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectRolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
          },
        },
        { provide: PROJECT_MEMBER_REPOSITORY, useValue: projectMemberRepo },
        { provide: TEAM_MEMBER_REPOSITORY, useValue: teamMemberRepo },
        { provide: PROJECT_REPOSITORY, useValue: projectRepo },
      ],
    }).compile();

    guard = module.get<ProjectRolesGuard>(ProjectRolesGuard);
    reflector = module.get<Reflector>(Reflector);
  };

  it('should pass when no roles are required', async () => {
    await buildModule(undefined);
    const ctx = makeMockContext({ id: USER_ID, accountRole: AccountRole.MEMBER }, { id: String(PROJECT_ID) });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(projectRepo.findById).not.toHaveBeenCalled();
  });

  it('should pass for admin bypassing all project checks', async () => {
    await buildModule([ProjectRole.TEAM_LEAD]);
    const ctx = makeMockContext({ id: USER_ID, accountRole: AccountRole.ADMIN }, { id: String(PROJECT_ID) });
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(projectRepo.findById).not.toHaveBeenCalled();
  });

  it('should pass for team owner bypassing project member check', async () => {
    await buildModule([ProjectRole.TEAM_LEAD]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({ teamRole: TeamRole.OWNER });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(PROJECT_ID) },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(projectMemberRepo.findByUserAndProject).not.toHaveBeenCalled();
  });

  it('should pass when user has the required project role', async () => {
    await buildModule([ProjectRole.TEAM_LEAD]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({ teamRole: TeamRole.MEMBER });
    projectMemberRepo.findByUserAndProject.mockResolvedValue({ role: ProjectRole.TEAM_LEAD });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(PROJECT_ID) },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should pass when user role matches one of multiple required roles', async () => {
    await buildModule([ProjectRole.TEAM_LEAD, ProjectRole.DEVELOPER]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({ teamRole: TeamRole.MEMBER });
    projectMemberRepo.findByUserAndProject.mockResolvedValue({ role: ProjectRole.DEVELOPER });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { projectId: String(PROJECT_ID) },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should throw ForbiddenException when user lacks required project role', async () => {
    await buildModule([ProjectRole.TEAM_LEAD]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({ teamRole: TeamRole.MEMBER });
    projectMemberRepo.findByUserAndProject.mockResolvedValue({ role: ProjectRole.OBSERVER });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(PROJECT_ID) },
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not a project member', async () => {
    await buildModule([ProjectRole.TEAM_LEAD]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({ teamRole: TeamRole.MEMBER });
    projectMemberRepo.findByUserAndProject.mockResolvedValue(null);
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(PROJECT_ID) },
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when project is not found', async () => {
    await buildModule([ProjectRole.TEAM_LEAD]);
    projectRepo.findById.mockResolvedValue(null);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue(null);
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(PROJECT_ID) },
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not authenticated', async () => {
    await buildModule([ProjectRole.TEAM_LEAD]);
    const ctx = makeMockContext(undefined, { id: String(PROJECT_ID) });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should read metadata with PROJECT_ROLES_KEY', async () => {
    await buildModule([ProjectRole.TEAM_LEAD]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({ teamRole: TeamRole.OWNER });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(PROJECT_ID) },
    );
    await guard.canActivate(ctx);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(PROJECT_ROLES_KEY, expect.any(Array));
  });
});
