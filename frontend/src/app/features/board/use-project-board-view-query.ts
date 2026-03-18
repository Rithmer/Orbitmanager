import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { projectBoardApi } from '../../api/project-board'
import { appQueryKeys } from '../../query'

export function useProjectBoardViewQuery(projectId: number | null | undefined) {
  const enabled = Number.isInteger(projectId) && (projectId as number) > 0
  const resolvedProjectId = enabled ? (projectId as number) : 0

  return useQuery({
    queryKey: appQueryKeys.projects.boardView(resolvedProjectId),
    queryFn: ({ signal }) =>
      projectBoardApi.getBoardView(resolvedProjectId, { signal }),
    enabled,
    placeholderData: keepPreviousData,
  })
}
