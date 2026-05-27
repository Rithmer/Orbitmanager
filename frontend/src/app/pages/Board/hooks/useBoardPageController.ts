import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { useTheme } from '@/app/context/useTheme'
import { ProjectRole, TeamRole } from '@/app/types'
import { useAuth } from '@/app/context/useAuth'
import {
  useBoardMutations,
  useBoardTeamMembersQuery,
  useBoardProjectPickerQuery,
  useProjectBoardViewQuery,
  type ProjectBoardTask,
} from '@/app/features/board'
import type { TaskRiskOutput } from '@/app/types'
import type { ProjectsListViewItem } from '@/app/features/projects'
import { clearLastBoardProjectId } from '@/app/utils/lastBoardProjectStorage'
import { useBoardTaskFormController } from '@/app/pages/Board/hooks/useBoardTaskFormController'
import { useBoardTaskMenuDismiss } from '@/app/pages/Board/hooks/useBoardTaskMenuDismiss'
import { useBoardProjectPickerRouting } from '@/app/pages/Board/hooks/useBoardProjectPickerRouting'
import { useBoardPageSurfaceTokens } from '@/app/pages/Board/hooks/useBoardPageSurfaceTokens'
import type { BoardPageViewModel } from '@/app/pages/Board/types'

export function useBoardPageController(): BoardPageViewModel {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { projectId: projectIdParam } = useParams()
  const projectId = Number(projectIdParam)
  const hasProjectId = Number.isInteger(projectId) && projectId > 0
  const forceProjectPicker = searchParams.get('choose') === '1'

  const surface = useBoardPageSurfaceTokens(isDark)
  const { pageBg, cardBg, cardBorder, columnBg, textPrimary, textSecondary } = surface

  const boardQuery = useProjectBoardViewQuery(hasProjectId ? projectId : null)
  const projectBoardView = boardQuery.data

  const teamIdForBoard = hasProjectId ? projectBoardView?.project.teamId ?? null : null

  const teamMembersQuery = useBoardTeamMembersQuery(teamIdForBoard, {
    enabled: Boolean(user?.id),
  })

  const currentUserTeamMember = teamMembersQuery.data?.find((m) => m.userId === user?.id)

  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<ProjectBoardTask | null>(null)
  const [selectedTaskForRisk, setSelectedTaskForRisk] = useState<{
    task: ProjectBoardTask
    risk: TaskRiskOutput
  } | null>(null)
  const [openedTaskMenuId, setOpenedTaskMenuId] = useState<number | null>(null)
  const [kanbanColumnModal, setKanbanColumnModal] = useState<{
    title: string
    tasks: ProjectBoardTask[]
  } | null>(null)
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board')
  const [projectPickerSearch, setProjectPickerSearch] = useState('')

  const projectPickerQuery = useBoardProjectPickerQuery(hasProjectId)
  const {
    pendingTaskActions,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    changeTaskStatusMutation,
  } = useBoardMutations({
    projectId,
    hasProjectId,
    onCreateSuccess: () => undefined,
    onUpdateSuccess: () => undefined,
  })
  const taskForm = useBoardTaskFormController({
    hasProjectId,
    projectId,
    createTaskMutation,
    updateTaskMutation,
  })

  const pickerProjectsAll = useMemo(
    () => (projectPickerQuery.data?.items ?? []) as ProjectsListViewItem[],
    [projectPickerQuery.data?.items],
  )

  const pickerProjects = useMemo(() => {
    const q = projectPickerSearch.trim().toLowerCase()
    if (!q) return pickerProjectsAll
    return pickerProjectsAll.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.teamName.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    )
  }, [pickerProjectsAll, projectPickerSearch])

  useBoardProjectPickerRouting({
    forceProjectPicker,
    hasProjectId,
    pickerProjectsAll,
    projectId,
    projectPickerLoaded: projectPickerQuery.isSuccess,
    navigateToProject: (id) => navigate(`/board/${id}`, { replace: true }),
  })

  useBoardTaskMenuDismiss(openedTaskMenuId, setOpenedTaskMenuId)

  const isInitialLoading = hasProjectId && boardQuery.isLoading && !projectBoardView
  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoading)
  const showPickerSkeleton = useSmoothPageSkeleton(
    !hasProjectId && projectPickerQuery.isPending && !projectPickerQuery.data,
  )

  if (showInitialSkeleton) {
    return { phase: 'initial_skeleton', pageBg }
  }

  if (!hasProjectId && showPickerSkeleton) {
    return { phase: 'picker_skeleton', pageBg }
  }

  if (!hasProjectId) {
    return {
      phase: 'picker',
      pageBg,
      textPrimary,
      textSecondary,
      isDark,
      projectPickerSearch,
      onSearchChange: setProjectPickerSearch,
      pickerProjects,
      pickerProjectsAll,
      projectPickerQuery,
      onOpenProject: (id: number) => navigate(`/board/${id}`),
    }
  }

  if (boardQuery.isError && !projectBoardView) {
    return {
      phase: 'board_error',
      pageBg,
      textPrimary,
      textSecondary,
      error: boardQuery.error,
      onRetry: () => boardQuery.refetch(),
    }
  }

  if (!projectBoardView) {
    return { phase: 'board_pending' }
  }

  const projectMembers = projectBoardView.members
  const currentUserMember = user ? projectMembers.find((m) => m.userId === user.id) : undefined
  const canEditTasks =
    currentUserMember?.role === ProjectRole.TEAM_LEAD ||
    currentUserTeamMember?.teamRole === TeamRole.OWNER

  return {
    phase: 'board_loaded',
    pageBg,
    shell: {
      onToggleViewMode: () => setViewMode((m) => (m === 'board' ? 'list' : 'board')),
      boardIsFetching: boardQuery.isFetching,
      onBoardRefresh: () => boardQuery.refetch(),
      onCreateTask: taskForm.openTaskCreation,
      onOpenProjectPicker: () => {
        clearLastBoardProjectId()
        navigate('/board/0?choose=1')
      },
    },
    body: {
      projectBoardView,
      boardQuery,
      isDark,
      columnBg,
      cardBg,
      cardBorder,
      textPrimary,
      textSecondary,
      canEditTasks,
      viewMode,
      openedTaskMenuId,
      setOpenedTaskMenuId,
      kanbanColumnModal,
      setKanbanColumnModal,
      isRiskModalOpen,
      setIsRiskModalOpen,
      isTaskDetailsOpen,
      setIsTaskDetailsOpen,
      selectedTaskForDetails,
      setSelectedTaskForDetails,
      selectedTaskForRisk,
      setSelectedTaskForRisk,
      taskForm,
      mutations: {
        pendingTaskActions,
        changeTaskStatusMutation,
        deleteTaskMutation,
      },
    },
  }
}
