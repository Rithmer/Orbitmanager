import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { teamsApi } from '@/app/api/teams'
import { appQueryKeys } from '@/app/query'

export function useProjectTeamOptionsQuery(enabled: boolean) {
  return useQuery({
    queryKey: appQueryKeys.projects.teamOptions,
    queryFn: ({ signal }) =>
      teamsApi.list({ page: 1, limit: 1000, sort: 'name' }, { signal }),
    enabled,
    placeholderData: keepPreviousData,
  })
}
