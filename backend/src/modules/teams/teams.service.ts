import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import type { ITeamRepository } from '../../domain/repositories/team.repository';
import { TEAM_REPOSITORY } from '../../domain/repositories/team.repository';
import type { ITeamMemberRepository } from '../../domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import type { IUserRepository } from '../../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import type { IProjectRepository } from '../../domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { IProjectMemberRepository } from '../../domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import type { ITaskRepository } from '../../domain/repositories/task.repository';
import { TASK_REPOSITORY } from '../../domain/repositories/task.repository';
import { Team } from '../../domain/models/team.model';
import { TeamMember } from '../../domain/models/team-member.model';
import { TeamRole } from '../../common/enums/team-role.enum';
import { ProjectRole } from '../../common/enums/project-role.enum';
import { AccountRole } from '../../common/enums/account-role.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import {
  QueryHelper,
  QueryParams,
  PaginatedResult,
} from '../../common/helpers/query.helper';
import { AuditService } from '../audit-logs/audit.service';
import { AuditAction } from '../../common/enums/audit-action.enum';

@Injectable()
export class TeamsService {
  constructor(
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: ITeamRepository,
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: IProjectMemberRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: QueryParams): Promise<PaginatedResult<Team>> {
    const teams = await this.teamRepository.findAll();
    return QueryHelper.apply(teams, {
      ...params,
      searchFields: params.searchFields ?? ['name', 'description'],
    }) as PaginatedResult<Team>;
  }

  async findById(id: number): Promise<Team> {
    const team = await this.teamRepository.findById(id);
    if (!team) throw new NotFoundException(`Команда #${id} не найдена`);
    return team;
  }

  async create(
    dto: CreateTeamDto,
    userId: number,
  ): Promise<Team> {
    const now = new Date().toISOString();
    const team = await this.teamRepository.create({
      name: dto.name,
      description: dto.description ?? '',
      createdAt: now,
      createdById: userId,
    });

    await this.teamMemberRepository.create({
      userId,
      teamId: team.id,
      teamRole: TeamRole.OWNER,
    });

    await this.auditService.log(userId, AuditAction.CREATE, 'team', team.id, `Создана команда "${team.name}"`);

    return team;
  }

  async update(
    id: number,
    dto: UpdateTeamDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Team> {
    await this.findById(id);
    await this.assertOwnerOrAdmin(userId, id, userRole);

    const updated = await this.teamRepository.update(id, {
      ...dto,
    });
    if (!updated) throw new NotFoundException(`Команда #${id} не найдена`);

    await this.auditService.log(userId, AuditAction.UPDATE, 'team', id, `Обновлена команда "${updated.name}"`);

    return updated;
  }

  async remove(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    await this.findById(id);
    await this.assertOwnerOrAdmin(userId, id, userRole);

    const members = await this.teamMemberRepository.findByTeam(id);
    for (const m of members) {
      await this.teamMemberRepository.delete(m.id);
    }

    await this.cascadeDeleteProjectMembersByTeam(id);

    await this.teamRepository.delete(id);

    await this.auditService.log(userId, AuditAction.DELETE, 'team', id, `Удалена команда #${id}`);
  }

  async findMembers(teamId: number): Promise<TeamMember[]> {
    await this.findById(teamId);
    return this.teamMemberRepository.findByTeam(teamId);
  }

  async addMember(
    teamId: number,
    dto: AddTeamMemberDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<TeamMember> {
    await this.findById(teamId);
    await this.assertOwnerOrAdmin(userId, teamId, userRole);

    const user = await this.userRepository.findById(dto.userId);
    if (!user) throw new NotFoundException(`Пользователь #${dto.userId} не найден`);

    const existing = await this.teamMemberRepository.findByUserAndTeam(
      dto.userId,
      teamId,
    );
    if (existing) {
      throw new ConflictException(
        `Пользователь #${dto.userId} уже является участником команды #${teamId}`,
      );
    }

    const member = await this.teamMemberRepository.create({
      userId: dto.userId,
      teamId,
      teamRole: dto.teamRole,
    });

    await this.auditService.log(userId, AuditAction.ASSIGN, 'team_member', member.id, `Пользователь #${dto.userId} добавлен в команду #${teamId} с ролью ${dto.teamRole}`);

    return member;
  }

  async updateMember(
    memberId: number,
    dto: UpdateTeamMemberDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<TeamMember> {
    const member = await this.findMemberById(memberId);
    await this.assertOwnerOrAdmin(userId, member.teamId, userRole);

    if (
      dto.teamRole === TeamRole.OBSERVER &&
      member.teamRole !== TeamRole.OBSERVER
    ) {
      await this.syncProjectRolesForObserver(member.userId, member.teamId, userId);
    }

    const updated = await this.teamMemberRepository.update(memberId, {
      teamRole: dto.teamRole,
    });
    if (!updated)
      throw new NotFoundException(`Участник #${memberId} не найден`);

    await this.auditService.log(userId, AuditAction.UPDATE, 'team_member', memberId, `Роль участника #${memberId} изменена на ${dto.teamRole}`, member.teamRole, dto.teamRole);

    return updated;
  }

  async removeMember(
    memberId: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    const member = await this.findMemberById(memberId);
    await this.assertOwnerOrAdmin(userId, member.teamId, userRole);

    if (member.teamRole === TeamRole.OWNER) {
      const teamMembers = await this.teamMemberRepository.findByTeam(
        member.teamId,
      );
      const owners = teamMembers.filter((m) => m.teamRole === TeamRole.OWNER);
      if (owners.length <= 1) {
        throw new ForbiddenException(
          'Нельзя удалить единственного владельца команды',
        );
      }
    }

    await this.detachUserFromTeamProjects(
      member.userId,
      member.teamId,
      userId,
    );

    await this.teamMemberRepository.delete(memberId);

    await this.auditService.log(userId, AuditAction.DELETE, 'team_member', memberId, `Участник #${member.userId} удалён из команды #${member.teamId}`);
  }

  private async findMemberById(id: number): Promise<TeamMember> {
    const member = await this.teamMemberRepository.findById(id);
    if (!member) throw new NotFoundException(`Участник #${id} не найден`);
    return member;
  }

  private async assertOwnerOrAdmin(
    userId: number,
    teamId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    if (accountRole === AccountRole.ADMIN) return;

    const membership = await this.teamMemberRepository.findByUserAndTeam(
      userId,
      teamId,
    );
    if (!membership || membership.teamRole !== TeamRole.OWNER) {
      throw new ForbiddenException(
        'Только владелец команды может выполнить это действие',
      );
    }
  }

  private async detachUserFromTeamProjects(
    userId: number,
    teamId: number,
    actorUserId: number,
  ): Promise<void> {
    const teamProjectIds = await this.getTeamProjectIds(teamId);

    if (teamProjectIds.length === 0) return;

    await this.taskRepository.clearAssigneeByUserAndProjects(userId, teamProjectIds);

    const projectMemberships = (await this.projectMemberRepository.findByUser(userId))
      .filter((membership) => teamProjectIds.includes(membership.projectId));

    await this.projectMemberRepository.deleteByUserAndProjects(userId, teamProjectIds);

    for (const membership of projectMemberships) {
      await this.auditService.log(
        actorUserId,
        AuditAction.DELETE,
        'project_member',
        membership.id,
        `Участник #${userId} автоматически удалён из проекта #${membership.projectId} после удаления из команды #${teamId}`,
      );
    }
  }

  private async cascadeDeleteProjectMembersByTeam(
    teamId: number,
  ): Promise<void> {
    const teamProjects = await this.projectRepository.findByTeam(teamId);

    for (const project of teamProjects) {
      const tasks = await this.taskRepository.findByProject(project.id);
      for (const task of tasks) {
        await this.taskRepository.delete(task.id);
      }
      await this.projectMemberRepository.deleteByProject(project.id);
      await this.projectRepository.delete(project.id);
    }
  }

  private async syncProjectRolesForObserver(
    userId: number,
    teamId: number,
    actorUserId: number,
  ): Promise<void> {
    const teamProjectIds = await this.getTeamProjectIds(teamId);
    if (teamProjectIds.length === 0) return;

    const memberships = (await this.projectMemberRepository.findByUser(userId))
      .filter(
        (membership) =>
          teamProjectIds.includes(membership.projectId) &&
          membership.role !== ProjectRole.OBSERVER,
      );

    for (const membership of memberships) {
      const updated = await this.projectMemberRepository.update(membership.id, {
        role: ProjectRole.OBSERVER,
      });

      if (!updated) continue;

      await this.auditService.log(
        actorUserId,
        AuditAction.UPDATE,
        'project_member',
        membership.id,
        `Роль участника #${membership.id} автоматически изменена на observer после перевода в observer в команде #${teamId}`,
        membership.role,
        ProjectRole.OBSERVER,
      );
    }
  }

  private async getTeamProjectIds(teamId: number): Promise<number[]> {
    const teamProjects = await this.projectRepository.findByTeam(teamId);
    return teamProjects.map((project) => project.id);
  }
}
