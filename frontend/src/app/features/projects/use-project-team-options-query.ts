import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { teamsApi } from '../../api/teams'

export function useProjectTeamOptionsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['projects', 'team-options'] as const,
    queryFn: ({ signal }) =>
      teamsApi.list({ page: 1, limit: 1000, sort: 'name' }, { signal }),
    enabled,
    placeholderData: keepPreviousData,
  })
}
