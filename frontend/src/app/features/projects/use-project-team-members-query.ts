import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { teamsApi } from '@/app/api/teams'
import { appQueryKeys } from '@/app/query'

export function useProjectTeamMembersQuery(teamId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: appQueryKeys.projects.teamMembers(teamId),
    queryFn: ({ signal }) => teamsApi.getMembers(teamId as number, { signal }),
    enabled: enabled && teamId !== null,
    placeholderData: keepPreviousData,
  })
}
