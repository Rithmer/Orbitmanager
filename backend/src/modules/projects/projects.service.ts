import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InMemoryCacheService } from '@/common/cache/in-memory-cache.service';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import {
  PaginatedResult,
  QueryParams,
} from '@/common/helpers/query.helper';
import { ProjectMember } from '@/domain/models/project-member.model';
import { Project } from '@/domain/models/project.model';
import type { IProjectMemberRepository } from '@/domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import type { ITeamMemberRepository } from '@/domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import type { ITeamRepository } from '@/domain/repositories/team.repository';
import { TEAM_REPOSITORY } from '@/domain/repositories/team.repository';
import { AuditService } from '../audit-logs/audit.service';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { auditLogCreateInput } from '@/common/helpers/audit-log-prisma.helper';

@Injectable()
export class ProjectsService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: IProjectMemberRepository,
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(TEAM_REPOSITORY)
    private readonly teamRepository: ITeamRepository,
    private readonly auditService: AuditService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly cache: InMemoryCacheService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async findAll(
    params: QueryParams,
    userId: number,
    userRole: AccountRole,
  ): Promise<PaginatedResult<Project>> {
    const page = normalizePage(params.page);
    const limit = normalizeLimit(params.limit);
    const teamId =
      typeof params.filters?.['teamId'] === 'number'
        ? (params.filters['teamId'] as number)
        : undefined;
    const status =
      typeof params.filters?.['status'] === 'string'
        ? (params.filters['status'] as string)
        : undefined;

    if (this.projectRepository.findPage) {
      const projectIds =
        userRole === AccountRole.ADMIN
          ? undefined
          : await this.projectAccessService.getVisibleProjectIds(userId);

      if (projectIds && projectIds.length === 0) {
        return toPaginatedResult([], 0, page, limit);
      }

      const result = await this.projectRepository.findPage({
        page,
        limit,
        search: params.search,
        sort: params.sort,
        teamId,
        status,
        projectIds,
      });

      return toPaginatedResult(result.items, result.total, page, limit);
    }

    const projects =
      userRole === AccountRole.ADMIN
        ? await this.projectRepository.findAll()
        : await this.projectAccessService.getVisibleProjects(userId);

    return applyInMemoryPagination(
      projects
        .filter((project) => (teamId !== undefined ? project.teamId === teamId : true))
        .filter((project) => (status ? project.status === status : true))
        .filter((project) => {
          if (!params.search) {
            return true;
          }

          const search = params.search.toLowerCase();
          return [project.name, project.description].some((field) =>
            field.toLowerCase().includes(search),
          );
        }),
      page,
      limit,
    );
  }

  async findById(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`Проект #${id} не найден`);
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
    const team = await this.teamRepository.findById(dto.teamId);
    if (!team) {
      throw new NotFoundException(`Команда #${dto.teamId} не найдена`);
    }

    await this.projectAccessService.assertTeamOwnerOrAdmin(
      userId,
      dto.teamId,
      userRole,
    );

    if (this.prisma) {
      const project = await this.createWithTransaction(dto, userId);
      this.invalidateUserCaches(userId);
      return project;
    }

    const now = new Date().toISOString();
    const project = await this.projectRepository.create({
      teamId: dto.teamId,
      name: dto.name,
      description: dto.description ?? '',
      status: dto.status ?? ProjectStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    await this.auditService.log(
      userId,
      AuditAction.CREATE,
      'project',
      project.id,
      `Создан проект "${project.name}"`,
    );

    this.invalidateUserCaches(userId);
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

    const updated = await this.projectRepository.update(id, {
      ...dto,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundException(`Проект #${id} не найден`);
    }

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'project',
      id,
      `Обновлён проект "${updated.name}"`,
    );

    this.invalidateUserCaches(userId);
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

    await this.projectRepository.delete(id);

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'project',
      id,
      `Удалён проект "${project.name}"`,
    );

    this.invalidateUserCaches(userId);
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

    return this.projectMemberRepository.findByProject(projectId);
  }

  async findAllMembersBatch(
    userId: number,
    userRole: AccountRole,
  ): Promise<Record<number, ProjectMember[]>> {
    const projects =
      userRole === AccountRole.ADMIN
        ? await this.projectRepository.findAll()
        : await this.projectAccessService.getVisibleProjects(userId);
    const projectIds = projects.map((p) => p.id);
    const allMembers =
      await this.projectMemberRepository.findByProjects(projectIds);

    const result: Record<number, ProjectMember[]> = {};
    for (const id of projectIds) result[id] = [];
    for (const m of allMembers) {
      if (!result[m.projectId]) result[m.projectId] = [];
      result[m.projectId].push(m);
    }
    return result;
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

    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      dto.userId,
      project.teamId,
    );
    if (!teamMembership) {
      throw new BadRequestException(
        `Пользователь #${dto.userId} не является участником команды #${project.teamId}`,
      );
    }

    this.validateProjectRole(teamMembership.teamRole, dto.role);

    const existing = await this.projectMemberRepository.findByUserAndProject(
      dto.userId,
      projectId,
    );
    if (existing) {
      throw new ConflictException(
        `Пользователь #${dto.userId} уже является участником проекта #${projectId}`,
      );
    }

    const member = await this.projectMemberRepository.create({
      projectId,
      userId: dto.userId,
      role: dto.role,
      assignedAt: new Date().toISOString(),
    });

    await this.auditService.log(
      userId,
      AuditAction.ASSIGN,
      'project_member',
      member.id,
      `Пользователь #${dto.userId} добавлен в проект #${projectId} с ролью ${dto.role}`,
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

    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      member.userId,
      project.teamId,
    );
    if (teamMembership) {
      this.validateProjectRole(teamMembership.teamRole, dto.role);
    }

    const updated = await this.projectMemberRepository.update(memberId, {
      role: dto.role,
    });
    if (!updated) {
      throw new NotFoundException(`Участник проекта #${memberId} не найден`);
    }

    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'project_member',
      memberId,
      `Роль участника #${memberId} изменена на ${dto.role}`,
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

    if (this.prisma) {
      await this.removeMemberWithTransaction(member, userId);
      return;
    }

    await this.taskRepository.clearAssigneeByUserAndProjects(member.userId, [
      member.projectId,
    ]);

    await this.projectMemberRepository.delete(memberId);

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'project_member',
      memberId,
      `Участник #${member.userId} удалён из проекта #${member.projectId}`,
    );
  }

  private async findMemberById(id: number): Promise<ProjectMember> {
    const member = await this.projectMemberRepository.findById(id);
    if (!member) {
      throw new NotFoundException(`Участник проекта #${id} не найден`);
    }

    return member;
  }

  private invalidateUserCaches(userId: number): void {
    this.cache.invalidateByPrefix(`dashboard:summary:${userId}:`);
    this.cache.invalidateByPrefix(`reports:summary:${userId}:`);
  }

  private async createWithTransaction(
    dto: CreateProjectDto,
    userId: number,
  ): Promise<Project> {
    const timestamp = new Date();
    const project = await this.prisma!.$transaction(async (tx) => {
      const createdProject = await tx.project.create({
        data: {
          teamId: dto.teamId,
          name: dto.name,
          description: dto.description ?? '',
          status: dto.status ?? ProjectStatus.ACTIVE,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      });

      await tx.auditLog.create({
        data: auditLogCreateInput(
          userId,
          AuditAction.CREATE,
          'project',
          createdProject.id,
          `Создан проект "${createdProject.name}"`,
          timestamp,
        ),
      });

      return createdProject;
    });

    return mapProjectRecord(project);
  }

  private async removeMemberWithTransaction(
    member: ProjectMember,
    actorUserId: number,
  ): Promise<void> {
    const timestamp = new Date();

    await this.prisma!.$transaction(async (tx) => {
      await tx.taskAssignee.deleteMany({
        where: {
          userId: member.userId,
          task: { projectId: member.projectId },
        },
      });

      await tx.projectMember.delete({
        where: {
          id: member.id,
        },
      });

      await tx.auditLog.create({
        data: auditLogCreateInput(
          actorUserId,
          AuditAction.DELETE,
          'project_member',
          member.id,
          `Участник #${member.userId} удалён из проекта #${member.projectId}`,
          timestamp,
        ),
      });
    });
  }

  private validateProjectRole(
    teamRole: TeamRole,
    projectRole: ProjectRole,
  ): void {
    if (teamRole === TeamRole.MEMBER) {
      if (
        projectRole !== ProjectRole.TEAM_LEAD &&
        projectRole !== ProjectRole.DEVELOPER
      ) {
        throw new BadRequestException(
          'Участник команды (member) может получить роль team_lead или developer в проекте',
        );
      }
    } else if (teamRole === TeamRole.OBSERVER) {
      if (projectRole !== ProjectRole.OBSERVER) {
        throw new BadRequestException(
          'Наблюдатель команды (observer) может получить только роль observer в проекте',
        );
      }
    }
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

function mapProjectRecord(project: {
  id: number;
  teamId: number;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Project {
  return {
    id: project.id,
    teamId: project.teamId,
    name: project.name,
    description: project.description,
    status: project.status as ProjectStatus,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
