import { api, buildQuery, type ApiRequestOptions } from '@/app/api/client'
import type { PaginatedResult } from '@/app/types'
import type { ProjectsListViewItem, ProjectsListViewQueryParams } from '@/app/features/projects'

export const projectsListViewApi = {
  getListView(
    params: ProjectsListViewQueryParams,
    options: ApiRequestOptions = {},
  ): Promise<PaginatedResult<ProjectsListViewItem>> {
    return api.get(
      `/projects/list-view${buildQuery({
        page: params.page,
        limit: params.limit,
        search: params.search,
        teamId: params.teamId,
        status: params.status || undefined,
        sort: params.sort,
      })}`,
      options,
    )
  },
}
