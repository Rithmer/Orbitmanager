import { useQuery } from '@tanstack/react-query'
import { risksApi } from '../../api/risks'
import { appQueryKeys } from '../../query'

export function useRisksProjectsQuery(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: appQueryKeys.risks.projects(),
    queryFn: ({ signal }) => risksApi.getProjects({ signal }),
    staleTime: 60_000,
    enabled,
  })
}
