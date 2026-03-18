import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { TeamRolesGuard } from './team-roles.guard';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import { TeamRole } from '../enums/team-role.enum';
import { AccountRole } from '../enums/account-role.enum';
import { TEAM_ROLES_KEY } from '../decorators/team-roles.decorator';

const TEAM_ID = 10;
const USER_ID = 1;

const makeMockContext = (
  user: unknown,
  params: Record<string, string>,
): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
    getHandler: () => ({}),
    getClass: () => ({}),
  }) as unknown as ExecutionContext;

describe('TeamRolesGuard', () => {
  let guard: TeamRolesGuard;
  let reflector: Reflector;
  let teamMemberRepo: { findByUserAndTeam: jest.Mock };

  const buildModule = async (requiredRoles: TeamRole[] | undefined) => {
    teamMemberRepo = { findByUserAndTeam: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamRolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
          },
        },
        { provide: TEAM_MEMBER_REPOSITORY, useValue: teamMemberRepo },
      ],
    }).compile();

    guard = module.get<TeamRolesGuard>(TeamRolesGuard);
    reflector = module.get<Reflector>(Reflector);
  };

  it('should pass when no roles are required', async () => {
    await buildModule(undefined);
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(TEAM_ID) },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(teamMemberRepo.findByUserAndTeam).not.toHaveBeenCalled();
  });

  it('should pass when admin regardless of team membership', async () => {
    await buildModule([TeamRole.OWNER]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue(null);
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.ADMIN },
      { id: String(TEAM_ID) },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should pass when user has required team role (owner)', async () => {
    await buildModule([TeamRole.OWNER]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({
      teamRole: TeamRole.OWNER,
    });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(TEAM_ID) },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should pass when user has one of multiple required roles', async () => {
    await buildModule([TeamRole.OWNER, TeamRole.MEMBER]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({
      teamRole: TeamRole.MEMBER,
    });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { teamId: String(TEAM_ID) },
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
  });

  it('should throw ForbiddenException when user lacks required team role', async () => {
    await buildModule([TeamRole.OWNER]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({
      teamRole: TeamRole.OBSERVER,
    });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(TEAM_ID) },
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not a team member', async () => {
    await buildModule([TeamRole.OWNER]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue(null);
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(TEAM_ID) },
    );
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not authenticated', async () => {
    await buildModule([TeamRole.OWNER]);
    const ctx = makeMockContext(undefined, { id: String(TEAM_ID) });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should read metadata with TEAM_ROLES_KEY', async () => {
    await buildModule([TeamRole.OWNER]);
    teamMemberRepo.findByUserAndTeam.mockResolvedValue({
      teamRole: TeamRole.OWNER,
    });
    const ctx = makeMockContext(
      { id: USER_ID, accountRole: AccountRole.MEMBER },
      { id: String(TEAM_ID) },
    );
    await guard.canActivate(ctx);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      TEAM_ROLES_KEY,
      expect.any(Array),
    );
  });
});
