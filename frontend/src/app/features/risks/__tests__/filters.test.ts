import { describe, expect, it } from 'vitest'
import { resolveRoleScopedProjects, resolveRoleScopedTeams } from '../filters'
import { AccountRole, ProjectRole, TeamRole, type ProjectMember, type Team, type TeamMember } from '../../../types'
import type { RiskProjectOption } from '../types'

describe('risks filters', () => {
  const teams: Team[] = [
    { id: 1, name: 'A', createdAt: '', createdById: 1 },
    { id: 2, name: 'B', createdAt: '', createdById: 1 },
  ]

  const projects: RiskProjectOption[] = [
    { id: 11, name: 'P-11', teamId: 1 },
    { id: 12, name: 'P-12', teamId: 1 },
    { id: 21, name: 'P-21', teamId: 2 },
  ]

  const teamMembersByTeam: Record<number, TeamMember[]> = {
    1: [{ id: 1, teamId: 1, userId: 7, teamRole: TeamRole.OWNER }],
    2: [{ id: 2, teamId: 2, userId: 7, teamRole: TeamRole.MEMBER }],
  }

  const projectMembersByProject: Record<number, ProjectMember[]> = {
    11: [{ id: 1, projectId: 11, userId: 8, role: ProjectRole.TEAM_LEAD, assignedAt: '' }],
    12: [{ id: 2, projectId: 12, userId: 7, role: ProjectRole.DEVELOPER, assignedAt: '' }],
    21: [{ id: 3, projectId: 21, userId: 7, role: ProjectRole.TEAM_LEAD, assignedAt: '' }],
  }

  it('returns all teams and projects for admin', () => {
    expect(
      resolveRoleScopedTeams(AccountRole.ADMIN, 7, teams, teamMembersByTeam).map((team) => team.id),
    ).toEqual([1, 2])

    expect(
      resolveRoleScopedProjects(
        AccountRole.ADMIN,
        7,
        projects,
        undefined,
        teamMembersByTeam,
        projectMembersByProject,
      ).map((project) => project.id),
    ).toEqual([11, 12, 21])
  })

  it('returns only owner teams and owner-team projects for member-owner', () => {
    expect(
      resolveRoleScopedTeams(AccountRole.MEMBER, 7, teams, teamMembersByTeam).map((team) => team.id),
    ).toEqual([1])

    expect(
      resolveRoleScopedProjects(
        AccountRole.MEMBER,
        7,
        projects,
        undefined,
        teamMembersByTeam,
        projectMembersByProject,
      ).map((project) => project.id),
    ).toEqual([11, 12])
  })

  it('returns lead projects when user is not owner', () => {
    expect(
      resolveRoleScopedProjects(
        AccountRole.MEMBER,
        8,
        projects,
        undefined,
        teamMembersByTeam,
        projectMembersByProject,
      ).map((project) => project.id),
    ).toEqual([11])
  })

  it('filters owner projects by the selected team id', () => {
    expect(
      resolveRoleScopedProjects(
        AccountRole.MEMBER,
        7,
        projects,
        1,
        teamMembersByTeam,
        projectMembersByProject,
      ).map((project) => project.id),
    ).toEqual([11, 12])
  })
})
