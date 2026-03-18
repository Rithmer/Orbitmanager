import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { teamsListViewApi } from '../../api/teams-list-view'
import { appQueryKeys } from '../../query'
import type { TeamsListViewQueryParams } from './types'

function buildRequestParams(params: TeamsListViewQueryParams) {
  const search = params.search?.trim()

  return {
    page: params.page,
    limit: params.limit,
    search: search || undefined,
    sort: params.sort || undefined,
  }
}

export function useTeamsListViewQuery(params: TeamsListViewQueryParams) {
  const requestParams = buildRequestParams(params)

  return useQuery({
    queryKey: appQueryKeys.teams.listView(requestParams),
    queryFn: ({ signal }) => teamsListViewApi.getListView(requestParams, { signal }),
    placeholderData: keepPreviousData,
  })
}
