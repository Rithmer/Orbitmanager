import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/app/api/projects'
import { appQueryKeys } from '@/app/query'

export function useProjectMembersQuery(projectId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: appQueryKeys.projects.membersByProject(projectId),
    queryFn: ({ signal }) => projectsApi.getMembers(projectId as number, { signal }),
    enabled: enabled && projectId !== null,
    placeholderData: keepPreviousData,
  })
}
