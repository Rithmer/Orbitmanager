import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '@/app/query'
import { reportsApi } from '@/app/api/reports'

export function useReportsSummaryQuery(
  projectId?: number,
  options?: { enabled?: boolean },
) {
  const resolvedProjectId =
    projectId !== undefined && Number.isInteger(projectId) ? projectId : undefined

  return useQuery({
    queryKey: appQueryKeys.reports.summary({ projectId: resolvedProjectId }),
    queryFn: ({ signal }) => reportsApi.getSummary({ projectId: resolvedProjectId }, { signal }),
    staleTime: 60_000,
    enabled: options?.enabled !== false,
  })
}
