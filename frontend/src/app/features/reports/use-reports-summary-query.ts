import { useQuery } from '@tanstack/react-query'
import { appQueryKeys } from '../../query'
import { reportsApi } from '../../api/reports'

export function useReportsSummaryQuery() {
  return useQuery({
    queryKey: appQueryKeys.reports.summary(),
    queryFn: ({ signal }) => reportsApi.getSummary({ signal }),
    staleTime: 60_000,
  })
}
