import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { projectsApi } from '../../api/projects'

export function useProjectMembersQuery(projectId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: ['projects', 'members', projectId ?? null] as const,
    queryFn: ({ signal }) => projectsApi.getMembers(projectId as number, { signal }),
    enabled: enabled && projectId !== null,
    placeholderData: keepPreviousData,
  })
}
