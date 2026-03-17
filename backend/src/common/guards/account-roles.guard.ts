import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthenticatedRequest,
  getAuthenticatedUser,
} from '@/common/http/authenticated-request';
import { AccountRole } from '../enums/account-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class AccountRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AccountRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = getAuthenticatedUser(request);

    if (!user || !user.accountRole) {
      throw new ForbiddenException('Доступ запрещён');
    }

    if (!requiredRoles.includes(user.accountRole)) {
      throw new ForbiddenException(
        `Требуется роль: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
