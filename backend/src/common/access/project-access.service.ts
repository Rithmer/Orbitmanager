import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import { TtlCacheService } from '@/common/cache/ttl-cache.service';
import type { Project } from '@/domain/models/project.model';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { IProjectMemberRepository } from '@/domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import type { ITeamMemberRepository } from '@/domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '@/domain/repositories/team-member.repository';

const VISIBLE_PROJECTS_TTL = 60_000;

@Injectable()
export class ProjectAccessService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: IProjectMemberRepository,
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
    private readonly cache: TtlCacheService,
  ) {}

  async getVisibleProjects(userId: number): Promise<Project[]> {
    return this.cache.getOrSet(
      `visible_projects:${userId}`,
      () => this.computeVisibleProjects(userId),
      VISIBLE_PROJECTS_TTL,
    );
  }

  private async computeVisibleProjects(userId: number): Promise<Project[]> {
    const visibleProjectIds = await this.getVisibleProjectIds(userId);
    if (visibleProjectIds.length === 0) {
      return [];
    }

    const teamMemberships = await this.teamMemberRepository.findByUser(userId);
    if (teamMemberships.length === 0) {
      return [];
    }

    const teamIds = [
      ...new Set(teamMemberships.map((membership) => membership.teamId)),
    ];
    const allTeamProjects = await this.projectRepository.findByTeams(teamIds);

    return this.dedupeProjects(
      allTeamProjects.filter((project) => visibleProjectIds.includes(project.id)),
    );
  }

  async getVisibleProjectIds(userId: number): Promise<number[]> {
    const teamMemberships = await this.teamMemberRepository.findByUser(userId);
    if (teamMemberships.length === 0) {
      return [];
    }

    const ownerTeamIds = [
      ...new Set(
        teamMemberships
          .filter((membership) => membership.teamRole === TeamRole.OWNER)
          .map((membership) => membership.teamId),
      ),
    ];

    const attachedOnlyTeamIds = [
      ...new Set(
        teamMemberships
          .filter((membership) => membership.teamRole !== TeamRole.OWNER)
          .map((membership) => membership.teamId),
      ),
    ];

    const [ownerProjectIds, attachedProjectIds] = await Promise.all([
      this.getProjectIdsForTeams(ownerTeamIds),
      this.getAttachedProjectIdsForTeams(userId, attachedOnlyTeamIds),
    ]);

    return [...new Set([...ownerProjectIds, ...attachedProjectIds])];
  }

  async assertProjectVisibility(
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

    if (teamMembership.teamRole === TeamRole.OWNER) {
      return;
    }

    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(
        userId,
        project.id,
      );

    if (!projectMembership) {
      throw new ForbiddenException('У вас нет доступа к этому проекту');
    }
  }

  async assertTeamOwnerOrAdmin(
    userId: number,
    teamId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    if (accountRole === AccountRole.ADMIN) {
      return;
    }

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

  async assertCanManageProject(
    project: Project,
    userId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    await this.assertTeamOwnerOrProjectLead(
      userId,
      project.teamId,
      project.id,
      accountRole,
      'Только владелец команды или тимлид проекта может выполнить это действие',
    );
  }

  async assertTeamOwnerOrProjectLead(
    userId: number,
    teamId: number,
    projectId: number,
    accountRole: AccountRole,
    errorMessage = 'Только владелец команды или тимлид проекта может выполнить это действие',
  ): Promise<void> {
    const canManage = await this.hasTeamOwnershipOrProjectLead(
      userId,
      teamId,
      projectId,
      accountRole,
    );

    if (!canManage) {
      throw new ForbiddenException(errorMessage);
    }
  }

  async hasTeamOwnershipOrProjectLead(
    userId: number,
    teamId: number,
    projectId: number,
    accountRole: AccountRole,
  ): Promise<boolean> {
    if (accountRole === AccountRole.ADMIN) {
      return true;
    }

    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      userId,
      teamId,
    );

    if (teamMembership?.teamRole === TeamRole.OWNER) {
      return true;
    }

    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(
        userId,
        projectId,
      );

    return projectMembership?.role === ProjectRole.TEAM_LEAD;
  }

  private async getProjectIdsForTeams(teamIds: number[]): Promise<number[]> {
    if (teamIds.length === 0) {
      return [];
    }

    return this.projectRepository.findIdsByTeams(teamIds);
  }

  /** Проекты команд, где пользователь не владелец: только с явным участием в проекте. */
  private async getAttachedProjectIdsForTeams(
    userId: number,
    teamIds: number[],
  ): Promise<number[]> {
    if (teamIds.length === 0) {
      return [];
    }

    const projectMemberships =
      await this.projectMemberRepository.findByUser(userId);
    if (projectMemberships.length === 0) {
      return [];
    }

    const membershipProjectIds = [
      ...new Set(projectMemberships.map((membership) => membership.projectId)),
    ];
    const membershipProjects = await this.projectRepository.findByIds(membershipProjectIds);

    const teamSet = new Set(teamIds);
    const membershipProjectIdSet = new Set(membershipProjectIds);
    return membershipProjects
      .filter(
        (project) =>
          teamSet.has(project.teamId) &&
          membershipProjectIdSet.has(project.id),
      )
      .map((project) => project.id);
  }

  invalidateVisibleProjects(userId: number): void {
    this.cache.invalidate(`visible_projects:${userId}`);
  }

  private dedupeProjects(projects: Project[]): Project[] {
    const seen = new Set<number>();

    return projects.filter((project) => {
      if (seen.has(project.id)) {
        return false;
      }

      seen.add(project.id);
      return true;
    });
  }
}
