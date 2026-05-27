import { useQuery } from '@tanstack/react-query'
import { risksApi } from '@/app/api/risks'
import { appQueryKeys } from '@/app/query'

export function useRisksProjectsQuery(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: appQueryKeys.risks.projects(),
    queryFn: ({ signal }) => risksApi.getProjects({ signal }),
    staleTime: 60_000,
    enabled,
  })
}
