import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '@/app/query'
import { reportsApi } from '@/app/api/reports'

export function useReportsSummaryQuery(
  params: { projectId?: number; teamId?: number } = {},
  options?: { enabled?: boolean },
) {
  const resolvedProjectId =
    params.projectId !== undefined && Number.isInteger(params.projectId) ? params.projectId : undefined
  const resolvedTeamId =
    resolvedProjectId === undefined && params.teamId !== undefined && Number.isInteger(params.teamId)
      ? params.teamId
      : undefined

  return useQuery({
    queryKey: appQueryKeys.reports.summary({ projectId: resolvedProjectId ?? null, teamId: resolvedTeamId ?? null }),
    queryFn: ({ signal }) => reportsApi.getSummary({ projectId: resolvedProjectId, teamId: resolvedTeamId }, { signal }),
    staleTime: 60_000,
    enabled: options?.enabled !== false,
  })
}
