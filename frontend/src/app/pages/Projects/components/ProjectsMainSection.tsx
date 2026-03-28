import {
  PageCardGridSkeleton,
  PageRefreshOverlay,
  PageToolbarSkeleton,
  RefreshBadge,
} from '@/app/components/PageShell'
import { CARD_COLORS } from '@/app/pages/Projects/constants'
import { ProjectsToolbar } from '@/app/pages/Projects/components/ProjectsToolbar'
import { ProjectsEmptyState } from '@/app/pages/Projects/components/ProjectsEmptyState'
import { ProjectsErrorState } from '@/app/pages/Projects/components/ProjectsErrorState'
import { ProjectsProjectCard } from '@/app/pages/Projects/components/ProjectsProjectCard'
import type { ProjectsMainSectionProps } from '@/app/pages/Projects/types'

export function ProjectsMainSection({ vm }: ProjectsMainSectionProps) {
  const { navigate, shell, list, menu, projectForm, members } = vm
  const { isDark, theme, showInitialSkeleton } = shell
  const {
    searchInput,
    setSearchInput,
    filterTeamId,
    setFilterTeamId,
    filterStatus,
    setFilterStatus,
    resetToFirstPage,
    teamsOptionsQuery,
    listError,
    projectsQuery,
    isRefreshing,
    projects,
    totalProjects,
  } = list
  const { openMenuId, setOpenMenuId } = menu
  const { pendingDeleteProjectId, openEditModal, handleDeleteProject } = projectForm

  if (showInitialSkeleton) {
    return (
      <>
        <PageToolbarSkeleton />
        <PageCardGridSkeleton variant="project" count={6} />
      </>
    )
  }

  if (listError && !projectsQuery.data) {
    return (
      <>
        <ProjectsToolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          filterTeamId={filterTeamId}
          onFilterTeamChange={(value) => {
            setFilterTeamId(value)
            resetToFirstPage()
          }}
          filterStatus={filterStatus}
          onFilterStatusChange={(value) => {
            setFilterStatus(value)
            resetToFirstPage()
          }}
          teams={teamsOptionsQuery.data?.items ?? []}
          inputBg={theme.inputBg}
          textSecondary={theme.textSecondary}
          totalProjects={0}
          isRefreshing={false}
        />
        <ProjectsErrorState message={listError} />
      </>
    )
  }

  return (
    <PageRefreshOverlay show={isRefreshing} label="Обновление проектов">
      <ProjectsToolbar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        filterTeamId={filterTeamId}
        onFilterTeamChange={(value) => {
          setFilterTeamId(value)
          resetToFirstPage()
        }}
        filterStatus={filterStatus}
        onFilterStatusChange={(value) => {
          setFilterStatus(value)
          resetToFirstPage()
        }}
        teams={teamsOptionsQuery.data?.items ?? []}
        inputBg={theme.inputBg}
        textSecondary={theme.textSecondary}
        totalProjects={totalProjects}
        isRefreshing={Boolean(projectsQuery.isFetching && projectsQuery.data)}
        refreshNode={<RefreshBadge isRefreshing={isRefreshing} label="Обновление..." />}
      />

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 page-load-stagger">
          {projects.map((project, index) => {
            const colorIndex = index % CARD_COLORS.length
            const isProjectDeletePending = pendingDeleteProjectId === project.id

            return (
              <ProjectsProjectCard
                key={project.id}
                cardColor={CARD_COLORS[colorIndex]}
                dividerColor={theme.dividerColor}
                isDark={isDark}
                isDeletePending={isProjectDeletePending}
                isMenuOpen={openMenuId === project.id}
                moreIconColor={theme.moreIconColor}
                project={project}
                projectIndex={index}
                statusClassMap={theme.statusClassMap}
                textPrimary={theme.textPrimary}
                textSecondary={theme.textSecondary}
                onCloseMenu={() => setOpenMenuId(null)}
                onDelete={() => void handleDeleteProject(project.id)}
                onNavigateToBoard={() => navigate(`/board/${project.id}`)}
                onOpenEdit={() => openEditModal(project.id)}
                onOpenMembers={() => members.openMembersModal(project.id)}
                onToggleMenu={() =>
                  setOpenMenuId((currentMenuId) => (currentMenuId === project.id ? null : project.id))
                }
              />
            )
          })}
        </div>
      ) : (
        <ProjectsEmptyState
          isDark={isDark}
          textSecondary={theme.textSecondary}
          searchTerm={list.searchTerm}
        />
      )}
    </PageRefreshOverlay>
  )
}
