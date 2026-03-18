import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AuthenticatedRequest,
  getAuthenticatedUser,
  getRouteParamAsNumber,
} from '@/common/http/authenticated-request';
import { ProjectRole } from '../enums/project-role.enum';
import { TeamRole } from '../enums/team-role.enum';
import { AccountRole } from '../enums/account-role.enum';
import { PROJECT_ROLES_KEY } from '../decorators/project-roles.decorator';
import type { IProjectMemberRepository } from '@/domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import type { ITeamMemberRepository } from '@/domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';

@Injectable()
export class ProjectRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: IProjectMemberRepository,
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(
      PROJECT_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = getAuthenticatedUser(request);

    if (!user) {
      throw new ForbiddenException('Доступ запрещён');
    }

    // Admin bypasses all project-level checks
    if (user.accountRole === AccountRole.ADMIN) {
      return true;
    }

    const projectId = getRouteParamAsNumber(request, 'projectId', 'id');
    if (!projectId) {
      throw new ForbiddenException('Не указан ID проекта');
    }

    // Load project to get teamId
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new ForbiddenException('Проект не найден');
    }

    // Team owner automatically passes all project-level role checks
    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      user.id,
      project.teamId,
    );
    if (teamMembership?.teamRole === TeamRole.OWNER) {
      return true;
    }

    // Check project-level role
    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(
        user.id,
        projectId,
      );

    if (!projectMembership) {
      throw new ForbiddenException('Вы не являетесь участником этого проекта');
    }

    if (!requiredRoles.includes(projectMembership.role)) {
      throw new ForbiddenException(
        `Требуется проектная роль: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
