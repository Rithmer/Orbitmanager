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
    list,
    projectForm,
    projectActions,
    members: membersBlock,
  }
}

export type ProjectsPageViewModel = ReturnType<typeof useProjectsPageController>
