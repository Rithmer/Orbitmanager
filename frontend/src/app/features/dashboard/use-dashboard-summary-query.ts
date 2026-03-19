import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '../../query'
import { dashboardApi } from '../../api/dashboard'

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: appQueryKeys.dashboard.summary,
    queryFn: ({ signal }) => dashboardApi.getSummary({ signal }),
    staleTime: 30_000,
  })
}
