import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useProjectsListViewQuery, useProjectTeamOptionsQuery } from '@/app/features/projects'
import { getErrorMessage } from '@/app/utils/errorMessage'
import { PAGE_SIZE } from '@/app/pages/Projects/constants'
import { useProjectsQueryState } from '@/app/pages/Projects/hooks/useProjectsQueryState'
import { useProjectMenuState } from '@/app/pages/Projects/hooks/useProjectMenuState'
import { useProjectsListFilters } from '@/app/pages/Projects/hooks/useProjectsListFilters'

export function useProjectsPageListBlock() {
  const [searchParams, setSearchParams] = useSearchParams()

  const { page, searchTerm, searchInput, setSearchInput, updatePage, resetToFirstPage, clampPage } =
    useProjectsQueryState(searchParams, setSearchParams)

  const listFilters = useProjectsListFilters()
  const { openMenuId, setOpenMenuId } = useProjectMenuState()

  const projectsQuery = useProjectsListViewQuery({
    page,
    limit: PAGE_SIZE,
    search: searchTerm || undefined,
    teamId: listFilters.filterTeamId ?? undefined,
    status: listFilters.filterStatus,
  })

  const teamsOptionsQuery = useProjectTeamOptionsQuery(true)

  const projects = projectsQuery.data?.items ?? []
  const isInitialLoading = projectsQuery.isPending && !projectsQuery.data
  const isRefreshing = projectsQuery.isFetching && !!projectsQuery.data
  const listError = getErrorMessage(projectsQuery.error)
  const totalProjects = projectsQuery.data?.total ?? 0
  const totalPages = projectsQuery.data?.totalPages ?? 1

  useEffect(() => {
    clampPage(totalPages)
  }, [clampPage, totalPages])

  useEffect(() => {
    setOpenMenuId(null)
  }, [listFilters.filterStatus, listFilters.filterTeamId, page, searchTerm, setOpenMenuId])

  return {
    page,
    searchTerm,
    searchInput,
    setSearchInput,
    updatePage,
    resetToFirstPage,
    filterTeamId: listFilters.filterTeamId,
    setFilterTeamId: listFilters.setFilterTeamId,
    filterStatus: listFilters.filterStatus,
    setFilterStatus: listFilters.setFilterStatus,
    projectsQuery,
    projects,
    listError,
    isRefreshing,
    totalProjects,
    totalPages,
    teamsOptionsQuery,
    openMenuId,
    setOpenMenuId,
    isInitialLoading,
  }
}

export type ProjectsPageListBlockReturn = ReturnType<typeof useProjectsPageListBlock>
