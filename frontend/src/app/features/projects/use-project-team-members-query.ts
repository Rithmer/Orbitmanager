import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { teamsApi } from '../../api/teams'

export function useProjectTeamMembersQuery(teamId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['projects', 'team-members', teamId ?? null] as const,
    queryFn: ({ signal }) => teamsApi.getMembers(teamId as number, { signal }),
    enabled: enabled && teamId !== null,
    placeholderData: keepPreviousData,
  })
}
