import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccountRolesGuard } from './account-roles.guard';
import { AccountRole } from '../enums/account-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('AccountRolesGuard', () => {
  let guard: AccountRolesGuard;
  let reflector: Reflector;

  const buildGuard = (
    requiredRoles: AccountRole[] | undefined,
    user: unknown,
  ) => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;
    guard = new AccountRolesGuard(reflector);

    const mockRequest = { user };
    const ctx = {
      switchToHttp: () => ({ getRequest: () => mockRequest }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    return ctx;
  };

  it('should pass when no roles are required', () => {
    const ctx = buildGuard(undefined, null);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should pass when empty roles array is required', () => {
    const ctx = buildGuard([], { accountRole: AccountRole.MEMBER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should pass when user has the required role', () => {
    const ctx = buildGuard([AccountRole.ADMIN], {
      accountRole: AccountRole.ADMIN,
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should pass when user has one of multiple required roles', () => {
    const ctx = buildGuard([AccountRole.ADMIN, AccountRole.MEMBER], {
      accountRole: AccountRole.MEMBER,
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when user lacks the required role', () => {
    const ctx = buildGuard([AccountRole.ADMIN], {
      accountRole: AccountRole.MEMBER,
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user is not present', () => {
    const ctx = buildGuard([AccountRole.ADMIN], null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException when user has no accountRole field', () => {
    const ctx = buildGuard([AccountRole.ADMIN], { id: 1 });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('should use ROLES_KEY to read metadata', () => {
    const ctx = buildGuard([AccountRole.ADMIN], {
      accountRole: AccountRole.ADMIN,
    });
    guard.canActivate(ctx);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
      ROLES_KEY,
      expect.any(Array),
    );
  });
});
