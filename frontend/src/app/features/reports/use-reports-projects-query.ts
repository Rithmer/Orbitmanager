import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '../../api/reports'
import { appQueryKeys } from '../../query'

export function useReportsProjectsQuery(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: appQueryKeys.reports.projects(),
    queryFn: ({ signal }) => reportsApi.getProjects({ signal }),
    staleTime: 60_000,
    enabled,
  })
}
