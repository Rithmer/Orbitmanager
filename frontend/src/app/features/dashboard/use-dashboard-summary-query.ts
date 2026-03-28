import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '@/app/query'
import { dashboardApi } from '@/app/api/dashboard'

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: appQueryKeys.dashboard.summary,
    queryFn: ({ signal }) => dashboardApi.getSummary({ signal }),
    staleTime: 30_000,
  })
}
