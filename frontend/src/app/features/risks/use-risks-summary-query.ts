import { useQuery } from '@tanstack/react-query'
import { risksApi } from '@/app/api/risks'
import { appQueryKeys } from '@/app/query'
import { adaptProjectRisksPayload } from '@/app/features/risks/adapters'
import type { RisksProjectCard } from '@/app/features/risks/types'

export function useRisksSummaryQuery(
  projectIds: number[],
  projectNamesById: Record<number, string>,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled !== false && projectIds.length > 0
  const stableProjectIds = [...projectIds].sort((a, b) => a - b)

  const query = useQuery({
    queryKey: appQueryKeys.risks.projectRisks({ projectIds: stableProjectIds.join(',') }),
    queryFn: ({ signal }) => risksApi.getProjectRisks({ projectIds: stableProjectIds }, { signal }),
    staleTime: 60_000,
    enabled,
  })

  const data: RisksProjectCard[] = adaptProjectRisksPayload(
    query.data,
    projectNamesById,
  )

  return {
    data,
    error: query.error,
    isPending: query.isPending,
    isFetching: query.isFetching,
    refetch: query.refetch,
  }
}
