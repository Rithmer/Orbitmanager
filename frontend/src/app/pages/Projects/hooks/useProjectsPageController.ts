import { useNavigate } from 'react-router'
import { useTheme } from '@/app/context/useTheme'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { useProjectsSectionAccess } from '@/app/hooks/useProjectsSectionAccess'
import { useProjectsPageThemeTokens } from '@/app/pages/Projects/hooks/useProjectsPageThemeTokens'
import { useProjectsProjectFormState } from '@/app/pages/Projects/hooks/useProjectsProjectFormState'
import { useProjectsMembersModalState } from '@/app/pages/Projects/hooks/useProjectsMembersModalState'
import { useProjectsPageListBlock } from '@/app/pages/Projects/hooks/useProjectsPageListBlock'
import { useProjectsPageProjectActions } from '@/app/pages/Projects/hooks/useProjectsPageProjectActions'
import { useProjectsPageMembersBlock } from '@/app/pages/Projects/hooks/useProjectsPageMembersBlock'

export function useProjectsPageController() {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const list = useProjectsPageListBlock()
  const projectForm = useProjectsProjectFormState()
  const members = useProjectsMembersModalState()

  const projectActions = useProjectsPageProjectActions({
    projectForm,
    projects: list.projects,
    setOpenMenuId: list.setOpenMenuId,
    teamsOptionsQuery: list.teamsOptionsQuery,
  })

  const membersBlock = useProjectsPageMembersBlock({
    members,
    projectForm,
    projects: list.projects,
  })

  const theme = useProjectsPageThemeTokens(isDark)
  const showInitialSkeleton = useSmoothPageSkeleton(list.isInitialLoading)
  const projectsSectionAccess = useProjectsSectionAccess()

  return {
    navigate,
    shell: {
      isDark,
      theme,
      projectsSectionAccess,
      showInitialSkeleton,
    },
    list: {
      page: list.page,
      searchTerm: list.searchTerm,
      searchInput: list.searchInput,
      setSearchInput: list.setSearchInput,
      updatePage: list.updatePage,
      resetToFirstPage: list.resetToFirstPage,
      filterTeamId: list.filterTeamId,
      setFilterTeamId: list.setFilterTeamId,
      filterStatus: list.filterStatus,
      setFilterStatus: list.setFilterStatus,
      projectsQuery: list.projectsQuery,
      projects: list.projects,
      listError: list.listError,
      isRefreshing: list.isRefreshing,
      totalProjects: list.totalProjects,
      totalPages: list.totalPages,
      teamsOptionsQuery: list.teamsOptionsQuery,
    },
    menu: {
      openMenuId: list.openMenuId,
      setOpenMenuId: list.setOpenMenuId,
    },
    projectForm: {
      showCreateModal: projectForm.showCreateModal,
      setShowCreateModal: projectForm.setShowCreateModal,
      showEditModal: projectForm.showEditModal,
      setShowEditModal: projectForm.setShowEditModal,
      editingProjectId: projectForm.editingProjectId,
      formName: projectForm.formName,
      setFormName: projectForm.setFormName,
      formDescription: projectForm.formDescription,
      setFormDescription: projectForm.setFormDescription,
      formTeamId: projectForm.formTeamId,
      setFormTeamId: projectForm.setFormTeamId,
      formStatus: projectForm.formStatus,
      setFormStatus: projectForm.setFormStatus,
      formLoading: projectForm.formLoading,
      formError: projectForm.formError,
      pendingDeleteProjectId: projectForm.pendingDeleteProjectId,
      openCreateModal: projectActions.openCreateModal,
      openEditModal: projectActions.openEditModal,
      handleCreateProject: projectActions.handleCreateProject,
      handleEditProject: projectActions.handleEditProject,
      handleDeleteProject: projectActions.handleDeleteProject,
    },
    members: membersBlock,
  }
}

export type ProjectsPageViewModel = ReturnType<typeof useProjectsPageController>
