import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '../api/projects'
import { teamsApi } from '../api/teams'
import { useAuth } from '../context/useAuth'
import { appQueryKeys } from '../query/query-keys'

export const NAV_MEMBERSHIP_BATCH_STALE_MS = 60_000


export function useNavMembershipBatch() {
  const { user, isAdmin } = useAuth()
  const uid = user?.id
  const enabled = Boolean(uid) && !isAdmin

  const teamsBatchQuery = useQuery({
    queryKey: appQueryKeys.nav.teamsMembersBatch(),
    queryFn: ({ signal }) => teamsApi.getAllMembersBatch({ signal }),
    enabled,
    staleTime: NAV_MEMBERSHIP_BATCH_STALE_MS,
  })

  const projectsBatchQuery = useQuery({
    queryKey: appQueryKeys.nav.projectsMembersBatch(),
    queryFn: ({ signal }) => projectsApi.getAllMembersBatch({ signal }),
    enabled,
    staleTime: NAV_MEMBERSHIP_BATCH_STALE_MS,
  })

  return {
    uid,
    isAdmin,
    enabled,
    teamsBatchQuery,
    projectsBatchQuery,
  }
}
