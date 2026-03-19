import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { projectsListViewApi } from '../../api/projects-list-view'
import { appQueryKeys } from '../../query'
import type { ProjectsListViewQueryParams } from './types'

function buildRequestParams(params: ProjectsListViewQueryParams) {
  const search = params.search?.trim()

  return {
    page: params.page,
    limit: params.limit,
    search: search || undefined,
    teamId: params.teamId,
    status: params.status || undefined,
    sort: params.sort || undefined,
  }
}

export function useProjectsListViewQuery(params: ProjectsListViewQueryParams) {
  const requestParams = buildRequestParams(params)

  return useQuery({
    queryKey: appQueryKeys.projects.listView(requestParams),
    queryFn: ({ signal }) => projectsListViewApi.getListView(requestParams, { signal }),
    placeholderData: keepPreviousData,
  })
}
