import { api, buildQuery, type ApiRequestOptions } from './client'
import type { PaginatedResult } from '../types'
import type { ProjectsListViewItem, ProjectsListViewQueryParams } from '../features/projects'

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
