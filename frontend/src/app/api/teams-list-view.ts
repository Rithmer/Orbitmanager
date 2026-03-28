import { api, buildQuery, type ApiRequestOptions } from '@/app/api/client'
import type { PaginatedResult } from '@/app/types'
import type { TeamsListViewItem, TeamsListViewQueryParams } from '@/app/features/teams'

export const teamsListViewApi = {
  getListView(
    params: TeamsListViewQueryParams,
    options: ApiRequestOptions = {},
  ): Promise<PaginatedResult<TeamsListViewItem>> {
    return api.get(
      `/teams/list-view${buildQuery({
        page: params.page,
        limit: params.limit,
        search: params.search,
        sort: params.sort,
      })}`,
      options,
    )
  },
}
