import { useQuery } from '@tanstack/react-query'
import { risksApi } from '../../api/risks'
import { appQueryKeys } from '../../query'
import { adaptProjectRisksPayload } from './adapters'
import type { RisksProjectCard } from './types'

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
