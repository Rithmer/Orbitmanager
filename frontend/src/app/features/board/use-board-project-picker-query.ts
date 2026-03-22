import { useQuery } from '@tanstack/react-query'
import { projectsListViewApi } from '../../api/projects-list-view'
import { appQueryKeys } from '../../query'

export function useBoardProjectPickerQuery(hasProjectId: boolean) {
  return useQuery({
    queryKey: appQueryKeys.board.projectPickerList(),
    queryFn: ({ signal }) =>
      projectsListViewApi.getListView({ page: 1, limit: 1000 }, { signal }),
    enabled: !hasProjectId,
  })
}
