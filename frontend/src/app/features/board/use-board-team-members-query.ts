import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '../../api/teams'
import { appQueryKeys } from '../../query'

export function useBoardTeamMembersQuery(
  teamId: number | null,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options

  return useQuery({
    queryKey: appQueryKeys.board.teamMembers(teamId),
    queryFn: ({ signal }) => {
      if (!teamId) return Promise.resolve([])
      return teamsApi.getMembers(teamId, { signal })
    },
    enabled: enabled && Boolean(teamId),
  })
}
