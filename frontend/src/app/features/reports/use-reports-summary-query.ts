import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '../../query'
import { reportsApi } from '../../api/reports'

export function useReportsSummaryQuery(projectId?: number) {
  const resolvedProjectId =
    projectId !== undefined && Number.isInteger(projectId) ? projectId : undefined

  return useQuery({
    queryKey: appQueryKeys.reports.summary({ projectId: resolvedProjectId }),
    queryFn: ({ signal }) => reportsApi.getSummary({ projectId: resolvedProjectId }, { signal }),
    staleTime: 60_000,
  })
}
