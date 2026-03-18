import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, type Project, type ProjectMember } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import {
  PaginatedResult,
  buildPaginatedResult,
  normalizePagination,
  parseSortField,
} from '@/common/query/pagination';
import { AuditService } from '../audit-logs/audit.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

export interface ProjectsListParams {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  teamId?: number;
  status?: string;
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async findAll(
    params: ProjectsListParams,
    userId: number,
    userRole: AccountRole,
  ): Promise<PaginatedResult<Project>> {
    const pagination = normalizePagination(params.page, params.limit);
    const visibleProjectIds =
      userRole === AccountRole.ADMIN
        ? null
        : await this.projectAccessService.getVisibleProjectIds(userId);

    if (visibleProjectIds && visibleProjectIds.length === 0) {
      return buildPaginatedResult([], 0, pagination.page, pagination.limit);
    }

    const where = this.buildWhere(params, visibleProjectIds);
    const orderBy = this.buildOrderBy(params.sort);

    const [total, projects] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return buildPaginatedResult(
      projects,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<Project> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`РџСЂРѕРµРєС‚ #${id} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    if (userRole !== AccountRole.ADMIN) {
      await this.projectAccessService.assertProjectVisibility(project, userId);
    }

    return project;
  }

  async create(
    dto: CreateProjectDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Project> {
    const team = await this.prisma.team.findUnique({
      where: { id: dto.teamId },
      select: { id: true },
    });
    if (!team) {
      throw new NotFoundException(`РљРѕРјР°РЅРґР° #${dto.teamId} РЅРµ РЅР°Р№РґРµРЅР°`);
    }

    await this.projectAccessService.assertTeamOwnerOrAdmin(
      userId,
      dto.teamId,
      userRole,
    );

    const project = await this.prisma.project.create({
      data: {
        teamId: dto.teamId,
        name: dto.name,
        description: dto.description ?? '',
        status: dto.status ?? ProjectStatus.ACTIVE,
      },
    });

    await this.auditService.log(
      userId,
      AuditAction.CREATE,
      'project',
      project.id,
      `РЎРѕР·РґР°РЅ РїСЂРѕРµРєС‚ "${project.name}"`,
    );

    return project;
  }

  async update(
    id: number,
    dto: UpdateProjectDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Project> {
    const project = await this.findById(id, userId, userRole);

    await this.projectAccessService.assertCanManageProject(
      project,
      userId,
      userRole,
    );

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
    });

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'project',
      id,
      `РћР±РЅРѕРІР»С‘РЅ РїСЂРѕРµРєС‚ "${updated.name}"`,
    );

    return updated;
  }

  async remove(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    const project = await this.findById(id, userId, userRole);

    await this.projectAccessService.assertTeamOwnerOrAdmin(
      userId,
      project.teamId,
      userRole,
    );

    await this.prisma.project.delete({ where: { id } });

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'project',
      id,
      `РЈРґР°Р»С‘РЅ РїСЂРѕРµРєС‚ "${project.name}"`,
    );
  }

  async findMembers(
    projectId: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<ProjectMember[]> {
    const project = await this.findById(projectId, userId, userRole);

    if (userRole !== AccountRole.ADMIN) {
      await this.projectAccessService.assertProjectVisibility(project, userId);
    }

    return this.prisma.projectMember.findMany({
      where: { projectId },
      orderBy: { id: 'asc' },
    });
  }

  async addMember(
    projectId: number,
    dto: AddProjectMemberDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<ProjectMember> {
    const project = await this.findById(projectId, userId, userRole);

    await this.projectAccessService.assertTeamOwnerOrAdmin(
      userId,
      project.teamId,
      userRole,
    );

    const teamMembership = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: dto.userId,
          teamId: project.teamId,
        },
      },
    });
    if (!teamMembership) {
      throw new BadRequestException(
        `РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${dto.userId} РЅРµ СЏРІР»СЏРµС‚СЃСЏ СѓС‡Р°СЃС‚РЅРёРєРѕРј РєРѕРјР°РЅРґС‹ #${project.teamId}`,
      );
    }

    this.validateProjectRole(teamMembership.teamRole, dto.role);

    const existing = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: dto.userId,
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${dto.userId} СѓР¶Рµ СЏРІР»СЏРµС‚СЃСЏ СѓС‡Р°СЃС‚РЅРёРєРѕРј РїСЂРѕРµРєС‚Р° #${projectId}`,
      );
    }

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role,
      },
    });

    await this.auditService.log(
      userId,
      AuditAction.ASSIGN,
      'project_member',
      member.id,
      `РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${dto.userId} РґРѕР±Р°РІР»РµРЅ РІ РїСЂРѕРµРєС‚ #${projectId} СЃ СЂРѕР»СЊСЋ ${dto.role}`,
    );

    return member;
  }

  async updateMember(
    memberId: number,
    dto: UpdateProjectMemberDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<ProjectMember> {
    const member = await this.findMemberById(memberId);
    const project = await this.findById(member.projectId, userId, userRole);

    await this.projectAccessService.assertTeamOwnerOrAdmin(
      userId,
      project.teamId,
      userRole,
    );

    const teamMembership = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: member.userId,
          teamId: project.teamId,
        },
      },
    });
    if (teamMembership) {
      this.validateProjectRole(teamMembership.teamRole, dto.role);
    }

    const updated = await this.prisma.projectMember.update({
      where: { id: memberId },
      data: { role: dto.role },
    });

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'project_member',
      memberId,
      `Р РѕР»СЊ СѓС‡Р°СЃС‚РЅРёРєР° #${memberId} РёР·РјРµРЅРµРЅР° РЅР° ${dto.role}`,
      member.role,
      dto.role,
    );

    return updated;
  }

  async removeMember(
    memberId: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    const member = await this.findMemberById(memberId);
    const project = await this.findById(member.projectId, userId, userRole);

    await this.projectAccessService.assertTeamOwnerOrAdmin(
      userId,
      project.teamId,
      userRole,
    );

    await this.prisma.$transaction(async (tx) => {
      await tx.task.updateMany({
        where: {
          assigneeId: member.userId,
          projectId: member.projectId,
        },
        data: { assigneeId: null },
      });

      await tx.projectMember.delete({ where: { id: memberId } });
    });

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'project_member',
      memberId,
      `РЈС‡Р°СЃС‚РЅРёРє #${member.userId} СѓРґР°Р»С‘РЅ РёР· РїСЂРѕРµРєС‚Р° #${member.projectId}`,
    );
  }

  private async findMemberById(id: number): Promise<ProjectMember> {
    const member = await this.prisma.projectMember.findUnique({ where: { id } });
    if (!member) {
      throw new NotFoundException(`РЈС‡Р°СЃС‚РЅРёРє РїСЂРѕРµРєС‚Р° #${id} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    return member;
  }

  private validateProjectRole(teamRole: string, projectRole: string): void {
    if (teamRole === TeamRole.MEMBER) {
      if (
        projectRole !== ProjectRole.TEAM_LEAD &&
        projectRole !== ProjectRole.DEVELOPER
      ) {
        throw new BadRequestException(
          'РЈС‡Р°СЃС‚РЅРёРє РєРѕРјР°РЅРґС‹ (member) РјРѕР¶РµС‚ РїРѕР»СѓС‡РёС‚СЊ СЂРѕР»СЊ team_lead РёР»Рё developer РІ РїСЂРѕРµРєС‚Рµ',
        );
      }
    } else if (teamRole === TeamRole.OBSERVER) {
      if (projectRole !== ProjectRole.OBSERVER) {
        throw new BadRequestException(
          'РќР°Р±Р»СЋРґР°С‚РµР»СЊ РєРѕРјР°РЅРґС‹ (observer) РјРѕР¶РµС‚ РїРѕР»СѓС‡РёС‚СЊ С‚РѕР»СЊРєРѕ СЂРѕР»СЊ observer РІ РїСЂРѕРµРєС‚Рµ',
        );
      }
    }
  }

  private buildWhere(
    params: ProjectsListParams,
    visibleProjectIds: number[] | null,
  ): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {
      ...(visibleProjectIds ? { id: { in: visibleProjectIds } } : {}),
      ...(params.teamId !== undefined ? { teamId: params.teamId } : {}),
      ...(params.status ? { status: params.status } : {}),
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(sort?: string): Prisma.ProjectOrderByWithRelationInput {
    const { field, direction } = parseSortField(
      sort,
      ['id', 'teamId', 'name', 'description', 'status', 'createdAt', 'updatedAt'],
      'id',
    );

    return { [field]: direction };
  }
}
