import { ForbiddenException, Injectable } from '@nestjs/common';
import type { Project, TeamMember } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { TeamRole } from '@/common/enums/team-role.enum';

@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async getVisibleProjects(userId: number): Promise<Project[]> {
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId },
      orderBy: { id: 'asc' },
    });
    if (teamMemberships.length === 0) {
      return [];
    }

    const teamIds = [...new Set(teamMemberships.map((membership) => membership.teamId))];
    const allTeamProjects = await this.prisma.project.findMany({
      where: { teamId: { in: teamIds } },
      orderBy: { id: 'asc' },
    });
    if (allTeamProjects.length === 0) {
      return [];
    }

    const visibleProjectIds = await this.buildVisibleProjectIds(
      teamMemberships,
      userId,
      allTeamProjects,
    );

    return allTeamProjects.filter((project) => visibleProjectIds.has(project.id));
  }

  async getVisibleProjectIds(userId: number): Promise<number[]> {
    const projects = await this.getVisibleProjects(userId);
    return projects.map((project) => project.id);
  }

  async assertProjectVisibility(project: Pick<Project, 'id' | 'teamId'>, userId: number): Promise<void> {
    const teamMembership = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: project.teamId,
        },
      },
    });

    if (!teamMembership) {
      throw new ForbiddenException(
        'Р’С‹ РЅРµ СЏРІР»СЏРµС‚РµСЃСЊ СѓС‡Р°СЃС‚РЅРёРєРѕРј РєРѕРјР°РЅРґС‹ СЌС‚РѕРіРѕ РїСЂРѕРµРєС‚Р°',
      );
    }

    if (this.canViewAllTeamProjects(teamMembership.teamRole)) {
      return;
    }

    const projectMembership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: project.id,
          userId,
        },
      },
    });

    if (!projectMembership) {
      throw new ForbiddenException('РЈ РІР°СЃ РЅРµС‚ РґРѕСЃС‚СѓРїР° Рє СЌС‚РѕРјСѓ РїСЂРѕРµРєС‚Сѓ');
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

  async assertCanManageProject(
    project: Pick<Project, 'id' | 'teamId'>,
    userId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    await this.assertTeamOwnerOrProjectLead(
      userId,
      project.teamId,
      project.id,
      accountRole,
      'РўРѕР»СЊРєРѕ РІР»Р°РґРµР»РµС† РєРѕРјР°РЅРґС‹ РёР»Рё С‚РёРјР»РёРґ РїСЂРѕРµРєС‚Р° РјРѕР¶РµС‚ РІС‹РїРѕР»РЅРёС‚СЊ СЌС‚Рѕ РґРµР№СЃС‚РІРёРµ',
    );
  }

  async assertTeamOwnerOrProjectLead(
    userId: number,
    teamId: number,
    projectId: number,
    accountRole: AccountRole,
    errorMessage = 'РўРѕР»СЊРєРѕ РІР»Р°РґРµР»РµС† РєРѕРјР°РЅРґС‹ РёР»Рё С‚РёРјР»РёРґ РїСЂРѕРµРєС‚Р° РјРѕР¶РµС‚ РІС‹РїРѕР»РЅРёС‚СЊ СЌС‚Рѕ РґРµР№СЃС‚РІРёРµ',
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

    const teamMembership = await this.prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    if (teamMembership?.teamRole === TeamRole.OWNER) {
      return true;
    }

    const projectMembership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    return projectMembership?.role === ProjectRole.TEAM_LEAD;
  }

  private async buildVisibleProjectIds(
    teamMemberships: TeamMember[],
    userId: number,
    allTeamProjects: Project[],
  ): Promise<Set<number>> {
    const ownerOrMemberTeams = new Set(
      teamMemberships
        .filter((membership) => this.canViewAllTeamProjects(membership.teamRole))
        .map((membership) => membership.teamId),
    );

    const observerTeams = new Set(
      teamMemberships
        .filter((membership) => membership.teamRole === TeamRole.OBSERVER)
        .map((membership) => membership.teamId),
    );

    if (observerTeams.size === 0) {
      return new Set(
        allTeamProjects
          .filter((project) => ownerOrMemberTeams.has(project.teamId))
          .map((project) => project.id),
      );
    }

    const projectMemberships = await this.prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true },
    });
    const assignedProjectIds = new Set(
      projectMemberships.map((membership) => membership.projectId),
    );

    return new Set(
      allTeamProjects
        .filter(
          (project) =>
            ownerOrMemberTeams.has(project.teamId) ||
            (observerTeams.has(project.teamId) &&
              assignedProjectIds.has(project.id)),
        )
        .map((project) => project.id),
    );
  }

  private canViewAllTeamProjects(teamRole: string): boolean {
    return teamRole === TeamRole.OWNER || teamRole === TeamRole.MEMBER;
  }
}
