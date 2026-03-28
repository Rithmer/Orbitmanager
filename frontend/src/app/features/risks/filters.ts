import { AccountRole, ProjectRole, TeamRole, type ProjectMember, type Team, type TeamMember } from '@/app/types'
import type { RiskProjectOption } from '@/app/features/risks/types'

export function getOwnedTeamIds(uid: number, membersByTeam: Record<number, TeamMember[]>): number[] {
  return Object.entries(membersByTeam)
    .filter(([, members]) => members.some((member) => member.userId === uid && member.teamRole === TeamRole.OWNER))
    .map(([teamId]) => Number(teamId))
}

export function getLeadProjectIds(uid: number, membersByProject: Record<number, ProjectMember[]>): number[] {
  return Object.entries(membersByProject)
    .filter(([, members]) =>
      members.some((member) => member.userId === uid && member.role === ProjectRole.TEAM_LEAD),
    )
    .map(([projectId]) => Number(projectId))
}

export function resolveRoleScopedProjects(
  role: AccountRole,
  uid: number,
  projects: RiskProjectOption[],
  selectedTeamId: number | undefined,
  teamMembersByTeam: Record<number, TeamMember[]>,
  projectMembersByProject: Record<number, ProjectMember[]>,
): RiskProjectOption[] {
  if (role === AccountRole.ADMIN) {
    return selectedTeamId ? projects.filter((project) => project.teamId === selectedTeamId) : projects
  }

  const ownerTeamIds = new Set(getOwnedTeamIds(uid, teamMembersByTeam))
  const leadProjectIds = new Set(getLeadProjectIds(uid, projectMembersByProject))

  if (ownerTeamIds.size > 0) {
    return projects.filter((project) => {
      const inOwnedTeam = project.teamId !== undefined && ownerTeamIds.has(project.teamId)
      if (!inOwnedTeam) return false
      return selectedTeamId ? project.teamId === selectedTeamId : true
    })
  }

  return projects.filter((project) => leadProjectIds.has(project.id))
}

export function resolveRoleScopedTeams(
  role: AccountRole,
  uid: number,
  teams: Team[],
  teamMembersByTeam: Record<number, TeamMember[]>,
): Team[] {
  if (role === AccountRole.ADMIN) return teams
  const ownerTeamIds = new Set(getOwnedTeamIds(uid, teamMembersByTeam))
  return teams.filter((team) => ownerTeamIds.has(team.id))
}
