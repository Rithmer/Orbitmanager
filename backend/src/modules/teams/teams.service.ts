import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Prisma, type Team, type TeamMember } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { TeamRole } from '@/common/enums/team-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { AccountRole } from '@/common/enums/account-role.enum';
import {
  PaginatedResult,
  buildPaginatedResult,
  normalizePagination,
  parseSortField,
} from '@/common/query/pagination';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberDto } from './dto/update-team-member.dto';
import { AuditService } from '@/modules/audit-logs/audit.service';
import { AuditAction } from '@/common/enums/audit-action.enum';

export interface TeamsListParams {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(params: TeamsListParams): Promise<PaginatedResult<Team>> {
    const pagination = normalizePagination(params.page, params.limit);
    const where = this.buildWhere(params);
    const orderBy = this.buildOrderBy(params.sort);

    const [total, teams] = await Promise.all([
      this.prisma.team.count({ where }),
      this.prisma.team.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return buildPaginatedResult(
      teams,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(id: number): Promise<Team> {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) {
      throw new NotFoundException(`РљРѕРјР°РЅРґР° #${id} РЅРµ РЅР°Р№РґРµРЅР°`);
    }

    return team;
  }

  async create(dto: CreateTeamDto, userId: number): Promise<Team> {
    const team = await this.prisma.$transaction(async (tx) => {
      const createdTeam = await tx.team.create({
        data: {
          name: dto.name,
          description: dto.description ?? '',
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

      return createdTeam;
    });

    await this.auditService.log(
      userId,
      AuditAction.CREATE,
      'team',
      team.id,
      `РЎРѕР·РґР°РЅР° РєРѕРјР°РЅРґР° "${team.name}"`,
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

    const updated = await this.prisma.team.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
      },
    });

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'team',
      id,
      `РћР±РЅРѕРІР»РµРЅР° РєРѕРјР°РЅРґР° "${updated.name}"`,
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

    await this.prisma.team.delete({ where: { id } });

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'team',
      id,
      `РЈРґР°Р»РµРЅР° РєРѕРјР°РЅРґР° #${id}`,
    );
  }

  async findMembers(teamId: number): Promise<TeamMember[]> {
    await this.findById(teamId);

    return this.prisma.teamMember.findMany({
      where: { teamId },
      orderBy: { id: 'asc' },
    });
  }

  async addMember(
    teamId: number,
    dto: AddTeamMemberDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<TeamMember> {
    await this.findById(teamId);
    await this.assertOwnerOrAdmin(userId, teamId, userRole);

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException(
        `РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${dto.userId} РЅРµ РЅР°Р№РґРµРЅ`,
      );
    }

    const existing = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: dto.userId,
          teamId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${dto.userId} СѓР¶Рµ СЏРІР»СЏРµС‚СЃСЏ СѓС‡Р°СЃС‚РЅРёРєРѕРј РєРѕРјР°РЅРґС‹ #${teamId}`,
      );
    }

    const member = await this.prisma.teamMember.create({
      data: {
        userId: dto.userId,
        teamId,
        teamRole: dto.teamRole,
      },
    });

    await this.auditService.log(
      userId,
      AuditAction.ASSIGN,
      'team_member',
      member.id,
      `РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${dto.userId} РґРѕР±Р°РІР»РµРЅ РІ РєРѕРјР°РЅРґСѓ #${teamId} СЃ СЂРѕР»СЊСЋ ${dto.teamRole}`,
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
      await this.syncProjectRolesForObserver(member.userId, member.teamId, userId);
    }

    const updated = await this.prisma.teamMember.update({
      where: { id: memberId },
      data: { teamRole: dto.teamRole },
    });

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'team_member',
      memberId,
      `Р РѕР»СЊ СѓС‡Р°СЃС‚РЅРёРєР° #${memberId} РёР·РјРµРЅРµРЅР° РЅР° ${dto.teamRole}`,
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
      const ownersCount = await this.prisma.teamMember.count({
        where: {
          teamId: member.teamId,
          teamRole: TeamRole.OWNER,
        },
      });
      if (ownersCount <= 1) {
        throw new ForbiddenException(
          'РќРµР»СЊР·СЏ СѓРґР°Р»РёС‚СЊ РµРґРёРЅСЃС‚РІРµРЅРЅРѕРіРѕ РІР»Р°РґРµР»СЊС†Р° РєРѕРјР°РЅРґС‹',
        );
      }
    }

    await this.detachUserFromTeamProjects(member.userId, member.teamId, userId);
    await this.prisma.teamMember.delete({ where: { id: memberId } });

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'team_member',
      memberId,
      `РЈС‡Р°СЃС‚РЅРёРє #${member.userId} СѓРґР°Р»С‘РЅ РёР· РєРѕРјР°РЅРґС‹ #${member.teamId}`,
    );
  }

  private async findMemberById(id: number): Promise<TeamMember> {
    const member = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`РЈС‡Р°СЃС‚РЅРёРє #${id} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    return member;
  }

  private async assertOwnerOrAdmin(
    userId: number,
    teamId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    if (accountRole === AccountRole.ADMIN) {
      return;
    }

    const membership = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });
    if (!membership || membership.teamRole !== TeamRole.OWNER) {
      throw new ForbiddenException(
        'РўРѕР»СЊРєРѕ РІР»Р°РґРµР»РµС† РєРѕРјР°РЅРґС‹ РјРѕР¶РµС‚ РІС‹РїРѕР»РЅРёС‚СЊ СЌС‚Рѕ РґРµР№СЃС‚РІРёРµ',
      );
    }
  }

  private async detachUserFromTeamProjects(
    userId: number,
    teamId: number,
    actorUserId: number,
  ): Promise<void> {
    const teamProjectIds = await this.getTeamProjectIds(teamId);
    if (teamProjectIds.length === 0) {
      return;
    }

    const projectMemberships = await this.prisma.projectMember.findMany({
      where: {
        userId,
        projectId: { in: teamProjectIds },
      },
      orderBy: { id: 'asc' },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: {
          assigneeId: userId,
          projectId: { in: teamProjectIds },
        },
        data: {
          assigneeId: null,
        },
      });

      await tx.projectMember.deleteMany({
        where: {
          userId,
          projectId: { in: teamProjectIds },
        },
      });
    });

    for (const membership of projectMemberships) {
      await this.auditService.log(
        actorUserId,
        AuditAction.DELETE,
        'project_member',
        membership.id,
        `РЈС‡Р°СЃС‚РЅРёРє #${userId} Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё СѓРґР°Р»С‘РЅ РёР· РїСЂРѕРµРєС‚Р° #${membership.projectId} РїРѕСЃР»Рµ СѓРґР°Р»РµРЅРёСЏ РёР· РєРѕРјР°РЅРґС‹ #${teamId}`,
      );
    }
  }

  private async syncProjectRolesForObserver(
    userId: number,
    teamId: number,
    actorUserId: number,
  ): Promise<void> {
    const teamProjectIds = await this.getTeamProjectIds(teamId);
    if (teamProjectIds.length === 0) {
      return;
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: {
        userId,
        projectId: { in: teamProjectIds },
        role: { not: ProjectRole.OBSERVER },
      },
      orderBy: { id: 'asc' },
    });

    for (const membership of memberships) {
      await this.prisma.projectMember.update({
        where: { id: membership.id },
        data: { role: ProjectRole.OBSERVER },
      });

      await this.auditService.log(
        actorUserId,
        AuditAction.UPDATE,
        'project_member',
        membership.id,
        `Р РѕР»СЊ СѓС‡Р°СЃС‚РЅРёРєР° #${membership.id} Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РёР·РјРµРЅРµРЅР° РЅР° observer РїРѕСЃР»Рµ РїРµСЂРµРІРѕРґР° РІ observer РІ РєРѕРјР°РЅРґРµ #${teamId}`,
        membership.role,
        ProjectRole.OBSERVER,
      );
    }
  }

  private async getTeamProjectIds(teamId: number): Promise<number[]> {
    const teamProjects = await this.prisma.project.findMany({
      where: { teamId },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    return teamProjects.map((project) => project.id);
  }

  private buildWhere(params: TeamsListParams): Prisma.TeamWhereInput {
    if (!params.search) {
      return {};
    }

    return {
      OR: [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ],
    };
  }

  private buildOrderBy(sort?: string): Prisma.TeamOrderByWithRelationInput {
    const { field, direction } = parseSortField(
      sort,
      ['id', 'name', 'description', 'createdAt', 'createdById'],
      'id',
    );

    return { [field]: direction };
  }
}
