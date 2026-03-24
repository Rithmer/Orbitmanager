import { useQueries, useQuery } from '@tanstack/react-query'
import { risksApi } from '../../api/risks'
import { appQueryKeys } from '../../query'
import { adaptProjectRisksPayload } from './adapters'
import type { RisksProjectCard } from './types'
import type { RisksTaskRiskResponse } from '../../api/risks'

export function useRisksSummaryQuery(
  projectIds: number[],
  projectNamesById: Record<number, string>,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled !== false && projectIds.length > 0
  const stableProjectIds = [...projectIds].sort((a, b) => a - b)

  const projectRisksQuery = useQuery({
    queryKey: appQueryKeys.risks.projectRisks({ projectIds: stableProjectIds.join(',') }),
    queryFn: ({ signal }) => risksApi.getProjectRisks({ projectIds: stableProjectIds }, { signal }),
    staleTime: 60_000,
    enabled,
  })

  const taskRiskQueries = useQueries({
    queries: stableProjectIds.map((projectId) => ({
      queryKey: appQueryKeys.risks.taskRisks(projectId),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        risksApi.getProjectTaskRisks(projectId, { signal }),
      staleTime: 60_000,
      enabled,
    })),
  })

  const rawTaskRisksByProject = stableProjectIds.reduce<Record<number, RisksTaskRiskResponse>>(
    (acc, projectId, index) => {
      acc[projectId] = taskRiskQueries[index]?.data ?? {}
      return acc
    },
    {},
  )

  const data: RisksProjectCard[] = adaptProjectRisksPayload(
    projectRisksQuery.data,
    rawTaskRisksByProject,
    projectNamesById,
  )

  const isPending = projectRisksQuery.isPending || taskRiskQueries.some((query) => query.isPending)
  const isFetching = projectRisksQuery.isFetching || taskRiskQueries.some((query) => query.isFetching)
  const error = projectRisksQuery.error ?? taskRiskQueries.find((query) => query.error)?.error ?? null

  return {
    data,
    error,
    isPending,
    isFetching,
    refetch: async () => {
      await Promise.all([projectRisksQuery.refetch(), ...taskRiskQueries.map((query) => query.refetch())])
    },
  }
}
