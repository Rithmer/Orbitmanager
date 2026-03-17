import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { IProjectMemberRepository } from '@/domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import type { ITeamMemberRepository } from '@/domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import type { ITeamRepository } from '@/domain/repositories/team.repository';
import { TEAM_REPOSITORY } from '@/domain/repositories/team.repository';
import { Project } from '@/domain/models/project.model';
import { ProjectMember } from '@/domain/models/project-member.model';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { AccountRole } from '@/common/enums/account-role.enum';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { UpdateProjectMemberDto } from './dto/update-project-member.dto';
import {
  QueryHelper,
  QueryParams,
  PaginatedResult,
} from '@/common/helpers/query.helper';
import { AuditService } from '../audit-logs/audit.service';
import { AuditAction } from '@/common/enums/audit-action.enum';

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
  ) {}

  // ────────────── Projects CRUD ──────────────

  async findAll(
    params: QueryParams,
    userId: number,
    userRole: AccountRole,
  ): Promise<PaginatedResult<Project>> {
    let projects: Project[];

    if (userRole === AccountRole.ADMIN) {
      projects = await this.projectRepository.findAll();
    } else {
      projects = await this.getVisibleProjects(userId);
    }

    return QueryHelper.apply(
      projects,
      { ...params, searchFields: params.searchFields ?? ['name', 'description'] },
    ) as PaginatedResult<Project>;
  }

  async findById(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<Project> {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException(`Проект #${id} не найден`);

    if (userRole !== AccountRole.ADMIN) {
      await this.assertProjectVisibility(project, userId);
    }

    return project;
  }

  async create(
    dto: CreateProjectDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Project> {
    // Validate teamId exists
    const team = await this.teamRepository.findById(dto.teamId);
    if (!team) throw new NotFoundException(`Команда #${dto.teamId} не найдена`);

    // Only owner of the team can create projects
    await this.assertTeamOwnerOrAdmin(userId, dto.teamId, userRole);

    const now = new Date().toISOString();
    const project = await this.projectRepository.create({
      teamId: dto.teamId,
      name: dto.name,
      description: dto.description ?? '',
      status: dto.status ?? ProjectStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    await this.auditService.log(userId, AuditAction.CREATE, 'project', project.id, `Создан проект "${project.name}"`);

    return project;
  }

  async update(
    id: number,
    dto: UpdateProjectDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Project> {
    const project = await this.findById(id, userId, userRole);

    // owner or team_lead of this project
    await this.assertCanManageProject(project, userId, userRole);

    const updated = await this.projectRepository.update(id, {
      ...dto,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundException(`Проект #${id} не найден`);

    await this.auditService.log(userId, AuditAction.UPDATE, 'project', id, `Обновлён проект "${updated.name}"`);

    return updated;
  }

  async remove(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    const project = await this.findById(id, userId, userRole);

    // Only team owner can delete projects
    await this.assertTeamOwnerOrAdmin(userId, project.teamId, userRole);

    // Cascade: delete tasks belonging to this project
    const projectTasks = await this.taskRepository.findByProject(id);
    for (const task of projectTasks) {
      await this.taskRepository.delete(task.id);
    }

    // Cascade: delete project members
    await this.projectMemberRepository.deleteByProject(id);

    await this.projectRepository.delete(id);

    await this.auditService.log(userId, AuditAction.DELETE, 'project', id, `Удалён проект "${project.name}"`);
  }

  // ────────────── Project Members ──────────────

  async findMembers(
    projectId: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<ProjectMember[]> {
    const project = await this.findById(projectId, userId, userRole);

    // observer can see members only of their own assigned projects
    if (userRole !== AccountRole.ADMIN) {
      await this.assertProjectVisibility(project, userId);
    }

    return this.projectMemberRepository.findByProject(projectId);
  }

  async addMember(
    projectId: number,
    dto: AddProjectMemberDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<ProjectMember> {
    const project = await this.findById(projectId, userId, userRole);

    // Only team owner can assign to project
    await this.assertTeamOwnerOrAdmin(userId, project.teamId, userRole);

    // Validate user is a team member
    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      dto.userId,
      project.teamId,
    );
    if (!teamMembership) {
      throw new BadRequestException(
        `Пользователь #${dto.userId} не является участником команды #${project.teamId}`,
      );
    }

    // Validate project role based on team role
    this.validateProjectRole(teamMembership.teamRole, dto.role);

    // Check uniqueness
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

    await this.auditService.log(userId, AuditAction.ASSIGN, 'project_member', member.id, `Пользователь #${dto.userId} добавлен в проект #${projectId} с ролью ${dto.role}`);

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

    // Only team owner can change project roles
    await this.assertTeamOwnerOrAdmin(userId, project.teamId, userRole);

    // Validate project role based on team role
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
    if (!updated) throw new NotFoundException(`Участник проекта #${memberId} не найден`);

    await this.auditService.log(userId, AuditAction.UPDATE, 'project_member', memberId, `Роль участника #${memberId} изменена на ${dto.role}`, member.role, dto.role);

    return updated;
  }

  async removeMember(
    memberId: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    const member = await this.findMemberById(memberId);
    const project = await this.findById(member.projectId, userId, userRole);

    // Only team owner can remove from project
    await this.assertTeamOwnerOrAdmin(userId, project.teamId, userRole);

    await this.taskRepository.clearAssigneeByUserAndProjects(member.userId, [
      member.projectId,
    ]);

    await this.projectMemberRepository.delete(memberId);

    await this.auditService.log(userId, AuditAction.DELETE, 'project_member', memberId, `Участник #${member.userId} удалён из проекта #${member.projectId}`);
  }

  // ────────────── Helpers ──────────────

  private async findMemberById(id: number): Promise<ProjectMember> {
    const member = await this.projectMemberRepository.findById(id);
    if (!member)
      throw new NotFoundException(`Участник проекта #${id} не найден`);
    return member;
  }

  private async getVisibleProjects(userId: number): Promise<Project[]> {
    const teamMemberships = await this.teamMemberRepository.findByUser(userId);
    if (teamMemberships.length === 0) return [];

    // Один запрос вместо N (по одному на каждую команду)
    const teamIds = teamMemberships.map((tm) => tm.teamId);
    const allTeamProjects = await this.projectRepository.findByTeams(teamIds);

    const ownerOrMemberTeams = new Set(
      teamMemberships
        .filter(
          (tm) =>
            tm.teamRole === TeamRole.OWNER || tm.teamRole === TeamRole.MEMBER,
        )
        .map((tm) => tm.teamId),
    );
    const observerTeams = new Set(
      teamMemberships
        .filter((tm) => tm.teamRole === TeamRole.OBSERVER)
        .map((tm) => tm.teamId),
    );

    let visibleProjects: Project[];
    if (observerTeams.size > 0) {
      const projectMemberships =
        await this.projectMemberRepository.findByUser(userId);
      const assignedProjectIds = new Set(
        projectMemberships.map((pm) => pm.projectId),
      );
      visibleProjects = allTeamProjects.filter(
        (p) =>
          ownerOrMemberTeams.has(p.teamId) ||
          (observerTeams.has(p.teamId) && assignedProjectIds.has(p.id)),
      );
    } else {
      visibleProjects = allTeamProjects.filter((p) =>
        ownerOrMemberTeams.has(p.teamId),
      );
    }

    // Дедупликация
    const seen = new Set<number>();
    return visibleProjects.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }

  private async assertProjectVisibility(
    project: Project,
    userId: number,
  ): Promise<void> {
    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      userId,
      project.teamId,
    );

    if (!teamMembership) {
      throw new ForbiddenException(
        'Вы не являетесь участником команды этого проекта',
      );
    }

    if (
      teamMembership.teamRole === TeamRole.OWNER ||
      teamMembership.teamRole === TeamRole.MEMBER
    ) {
      return; // can see all team projects
    }

    // observer — only assigned projects
    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(
        userId,
        project.id,
      );
    if (!projectMembership) {
      throw new ForbiddenException(
        'У вас нет доступа к этому проекту',
      );
    }
  }

  private async assertTeamOwnerOrAdmin(
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

  private async assertCanManageProject(
    project: Project,
    userId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    if (accountRole === AccountRole.ADMIN) return;

    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      userId,
      project.teamId,
    );

    // team owner can manage any project
    if (teamMembership?.teamRole === TeamRole.OWNER) return;

    // team_lead of this specific project can manage it
    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(
        userId,
        project.id,
      );
    if (
      projectMembership &&
      projectMembership.role === ProjectRole.TEAM_LEAD
    ) {
      return;
    }

    throw new ForbiddenException(
      'Только владелец команды или тимлид проекта может выполнить это действие',
    );
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
    // owner bypasses — they don't need project membership
  }
}
