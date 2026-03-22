import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import type { ITeamRepository } from '@/domain/repositories/team.repository';
import { TEAM_REPOSITORY } from '@/domain/repositories/team.repository';
import type { ITeamMemberRepository } from '@/domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import type { IUserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '@/domain/repositories/user.repository';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { IProjectMemberRepository } from '@/domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { Team } from '@/domain/models/team.model';
import { TeamMember } from '@/domain/models/team-member.model';
import { TeamRole } from '@/common/enums/team-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { AccountRole } from '@/common/enums/account-role.enum';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import {
  QueryParams,
  PaginatedResult,
} from '@/common/helpers/query.helper';
import { AuditService } from '@/modules/audit-logs/audit.service';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { auditLogCreateInput } from '@/common/helpers/audit-log-prisma.helper';

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
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async findAll(params: QueryParams): Promise<PaginatedResult<Team>> {
    const page = normalizePage(params.page);
    const limit = normalizeLimit(params.limit);

    if (this.teamRepository.findPage) {
      const result = await this.teamRepository.findPage({
        page,
        limit,
        search: params.search,
        sort: params.sort,
      });

      return toPaginatedResult(result.items, result.total, page, limit);
    }

    const teams = await this.teamRepository.findAll();
    return applyInMemoryPagination(
      teams.filter((team) => {
        if (!params.search) {
          return true;
        }

        const search = params.search.toLowerCase();
        return [team.name, team.description].some((field) =>
          field.toLowerCase().includes(search),
        );
      }),
      page,
      limit,
    );
  }

  async findById(id: number): Promise<Team> {
    const team = await this.teamRepository.findById(id);
    if (!team) throw new NotFoundException(`Команда #${id} не найдена`);
    return team;
  }

  async create(dto: CreateTeamDto, userId: number): Promise<Team> {
    if (this.prisma) {
      return this.createWithTransaction(dto, userId);
    }

    const now = new Date().toISOString();
    let team: Team | null = null;

    try {
      team = await this.teamRepository.create({
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
    } catch (error) {
      if (team) {
        try {
          await this.teamRepository.delete(team.id);
        } catch {
        }
      }

      throw error;
    }

    await this.auditService.log(
      userId,
      AuditAction.CREATE,
      'team',
      team.id,
      `Создана команда "${team.name}"`,
    );

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

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'team',
      id,
      `Обновлена команда "${updated.name}"`,
    );

    return updated;
  }

  async remove(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    await this.findById(id);
    await this.assertOwnerOrAdmin(userId, id, userRole);

    await this.teamRepository.delete(id);

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'team',
      id,
      `Удалена команда #${id}`,
    );
  }

  async findMembers(teamId: number): Promise<TeamMember[]> {
    await this.findById(teamId);
    return this.teamMemberRepository.findByTeam(teamId);
  }

  async findAllMembersBatch(): Promise<Record<number, TeamMember[]>> {
    const teams = await this.teamRepository.findAll();
    const teamIds = teams.map((t) => t.id);
    const allMembers = await this.teamMemberRepository.findByTeams(teamIds);

    const result: Record<number, TeamMember[]> = {};
    for (const id of teamIds) result[id] = [];
    for (const m of allMembers) {
      if (!result[m.teamId]) result[m.teamId] = [];
      result[m.teamId].push(m);
    }
    return result;
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
    if (!user)
      throw new NotFoundException(`Пользователь #${dto.userId} не найден`);

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

    await this.auditService.log(
      userId,
      AuditAction.ASSIGN,
      'team_member',
      member.id,
      `Пользователь #${dto.userId} добавлен в команду #${teamId} с ролью ${dto.teamRole}`,
    );

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
      await this.syncProjectRolesForObserver(
        member.userId,
        member.teamId,
        userId,
      );
    }

    const updated = await this.teamMemberRepository.update(memberId, {
      teamRole: dto.teamRole,
    });
    if (!updated)
      throw new NotFoundException(`Участник #${memberId} не найден`);

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'team_member',
      memberId,
      `Роль участника #${memberId} изменена на ${dto.teamRole}`,
      member.teamRole,
      dto.teamRole,
    );

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

    if (this.prisma) {
      await this.removeMemberWithTransaction(member, userId);
      return;
    }

    await this.detachUserFromTeamProjects(member.userId, member.teamId, userId);

    await this.teamMemberRepository.delete(memberId);

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'team_member',
      memberId,
      `Участник #${member.userId} удалён из команды #${member.teamId}`,
    );
  }

  private async findMemberById(id: number): Promise<TeamMember> {
    const member = await this.teamMemberRepository.findById(id);
    if (!member) throw new NotFoundException(`Участник #${id} не найден`);
    return member;
  }

  private async createWithTransaction(
    dto: CreateTeamDto,
    userId: number,
  ): Promise<Team> {
    const timestamp = new Date();
    const team = await this.prisma!.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          name: dto.name,
          description: dto.description ?? '',
          createdAt: timestamp,
          createdById: userId,
        },
      });

      await tx.teamMember.create({
        data: {
          userId,
          teamId: createdTeam.id,
          teamRole: TeamRole.OWNER,
        },
      });

      await tx.auditLog.create({
        data: auditLogCreateInput(
          userId,
          AuditAction.CREATE,
          'team',
          createdTeam.id,
          `Создана команда "${createdTeam.name}"`,
          timestamp,
        ),
      });

      return createdTeam;
    });

    return mapTeamRecord(team);
  }

  private async removeMemberWithTransaction(
    member: TeamMember,
    actorUserId: number,
  ): Promise<void> {
    const teamProjectIds = await this.getTeamProjectIds(member.teamId);
    const timestamp = new Date();

    await this.prisma!.$transaction(async (tx) => {
      const projectMemberships =
        teamProjectIds.length === 0
          ? []
          : await tx.projectMember.findMany({
              where: {
                userId: member.userId,
                projectId: { in: teamProjectIds },
              },
            });

      if (teamProjectIds.length > 0) {
        await tx.taskAssignee.deleteMany({
          where: {
            userId: member.userId,
            task: { projectId: { in: teamProjectIds } },
          },
        });

        await tx.projectMember.deleteMany({
          where: {
            userId: member.userId,
            projectId: { in: teamProjectIds },
          },
        });

        if (projectMemberships.length > 0) {
          await tx.auditLog.createMany({
            data: projectMemberships.map((membership) =>
              auditLogCreateInput(
                actorUserId,
                AuditAction.DELETE,
                'project_member',
                membership.id,
                `Участник #${member.userId} автоматически удалён из проекта #${membership.projectId} после удаления из команды #${member.teamId}`,
                timestamp,
              ),
            ),
          });
        }
      }

      await tx.teamMember.delete({
        where: {
          id: member.id,
        },
      });

      await tx.auditLog.create({
        data: auditLogCreateInput(
          actorUserId,
          AuditAction.DELETE,
          'team_member',
          member.id,
          `Участник #${member.userId} удалён из команды #${member.teamId}`,
          timestamp,
        ),
      });
    });
  }

  private async assertOwnerOrAdmin(
    userId: number,
    teamId: number,
    _accountRole: AccountRole,
  ): Promise<void> {
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

    await this.taskRepository.clearAssigneeByUserAndProjects(
      userId,
      teamProjectIds,
    );

    const projectMemberships = (
      await this.projectMemberRepository.findByUser(userId)
    ).filter((membership) => teamProjectIds.includes(membership.projectId));

    await this.projectMemberRepository.deleteByUserAndProjects(
      userId,
      teamProjectIds,
    );

    if (projectMemberships.length > 0) {
      await this.auditService.logMany(
        projectMemberships.map((membership) => ({
          userId: actorUserId,
          action: AuditAction.DELETE,
          entityType: 'project_member',
          entityId: membership.id,
          description: `Участник #${userId} автоматически удалён из проекта #${membership.projectId} после удаления из команды #${teamId}`,
        })),
      );
    }
  }

  private async syncProjectRolesForObserver(
    userId: number,
    teamId: number,
    actorUserId: number,
  ): Promise<void> {
    const teamProjectIds = await this.getTeamProjectIds(teamId);
    if (teamProjectIds.length === 0) return;

    const memberships = (
      await this.projectMemberRepository.findByUser(userId)
    ).filter(
      (membership) =>
        teamProjectIds.includes(membership.projectId) &&
        membership.role !== ProjectRole.OBSERVER,
    );

    const auditEntries: Array<{
      userId: number;
      action: AuditAction;
      entityType: string;
      entityId: number;
      description: string;
      oldValue: string;
      newValue: string;
    }> = [];

    for (const membership of memberships) {
      const updated = await this.projectMemberRepository.update(membership.id, {
        role: ProjectRole.OBSERVER,
      });

      if (!updated) continue;

      auditEntries.push({
        userId: actorUserId,
        action: AuditAction.UPDATE,
        entityType: 'project_member',
        entityId: membership.id,
        description: `Роль участника #${membership.id} автоматически изменена на observer после перевода в observer в команде #${teamId}`,
        oldValue: membership.role,
        newValue: ProjectRole.OBSERVER,
      });
    }

    if (auditEntries.length > 0) {
      await this.auditService.logMany(auditEntries);
    }
  }

  private async getTeamProjectIds(teamId: number): Promise<number[]> {
    const teamProjects = await this.projectRepository.findByTeam(teamId);
    return teamProjects.map((project) => project.id);
  }
}

function normalizePage(page: number | undefined): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.trunc(page as number));
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.trunc(limit as number)));
}

function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

function applyInMemoryPagination<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const offset = (page - 1) * limit;
  return toPaginatedResult(items.slice(offset, offset + limit), items.length, page, limit);
}

function mapTeamRecord(team: {
  id: number;
  name: string;
  description: string;
  createdAt: Date;
  createdById: number;
}): Team {
  return {
    id: team.id,
    name: team.name,
    description: team.description,
    createdAt: team.createdAt.toISOString(),
    createdById: team.createdById,
  };
}

