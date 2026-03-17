import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TeamRole } from '../enums/team-role.enum';
import { TEAM_ROLES_KEY } from '../decorators/team-roles.decorator';
import type { ITeamMemberRepository } from '@/domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import { AccountRole } from '../enums/account-role.enum';

@Injectable()
export class TeamRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<TeamRole[]>(
      TEAM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as
      | { id: number; accountRole: AccountRole }
      | undefined;

    if (!user) {
      throw new ForbiddenException('Доступ запрещён');
    }

    if (user.accountRole === AccountRole.ADMIN) {
      return true;
    }

    const teamId = Number(request.params.teamId ?? request.params.id);
    if (!teamId || isNaN(teamId)) {
      throw new ForbiddenException('Не указан ID команды');
    }

    const membership = await this.teamMemberRepository.findByUserAndTeam(
      user.id,
      teamId,
    );

    if (!membership) {
      throw new ForbiddenException('Вы не являетесь участником этой команды');
    }

    if (!requiredRoles.includes(membership.teamRole)) {
      throw new ForbiddenException(
        `Требуется командная роль: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
