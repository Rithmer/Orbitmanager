import { useMemo } from 'react'
import { useNavMembershipBatch } from '@/app/hooks/useNavMembershipBatch'
import { ProjectRole, TeamRole } from '@/app/types'

export function useRisksSectionAccess() {
  const { uid, isAdmin, enabled, teamsBatchQuery, projectsBatchQuery } = useNavMembershipBatch()

  return useMemo(() => {
    if (isAdmin) {
      return { allowed: true, isLoading: false as boolean }
    }

    if (!uid) {
      return { allowed: false, isLoading: true as boolean }
    }

    const loading = enabled && (teamsBatchQuery.isPending || projectsBatchQuery.isPending)

    const teamMembersByTeam = teamsBatchQuery.data ?? {}
    const isTeamOwner = Object.values(teamMembersByTeam).some((members) =>
      members.some((m) => m.userId === uid && m.teamRole === TeamRole.OWNER),
    )

    const projectMembersByProject = projectsBatchQuery.data ?? {}
    const isProjectLead = Object.values(projectMembersByProject)
      .flat()
      .some((m) => m.userId === uid && m.role === ProjectRole.TEAM_LEAD)

    return {
      allowed: isTeamOwner || isProjectLead,
      isLoading: loading,
    }
  }, [
    enabled,
    isAdmin,
    projectsBatchQuery.data,
    projectsBatchQuery.isPending,
    teamsBatchQuery.data,
    teamsBatchQuery.isPending,
    uid,
  ])
}
