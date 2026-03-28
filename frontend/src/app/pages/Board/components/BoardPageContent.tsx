import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { PageShell, PageShellHeaderSkeleton } from '@/app/components/PageShell'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { useTheme } from '@/app/context/useTheme'
import { ProjectRole, TeamRole } from '@/app/types'
import { useAuth } from '@/app/context/useAuth'
import {
  BoardPickerSkeleton,
  BoardProjectPicker,
  useBoardMutations,
  useBoardTeamMembersQuery,
  useBoardProjectPickerQuery,
  useProjectBoardViewQuery,
  type ProjectBoardTask,
} from '@/app/features/board'
import { ProjectBoardSkeleton } from '@/app/features/board/board-view'
import type { TaskRiskOutput } from '@/app/types'
import { clearLastBoardProjectId } from '@/app/utils/lastBoardProjectStorage'
import { BoardPageActions } from '@/app/pages/Board/components/BoardPageActions'
import { useBoardTaskFormController } from '@/app/pages/Board/hooks/useBoardTaskFormController'
import { useBoardTaskMenuDismiss } from '@/app/pages/Board/hooks/useBoardTaskMenuDismiss'
import { useBoardProjectPickerRouting } from '@/app/pages/Board/hooks/useBoardProjectPickerRouting'
import { useBoardPageSurfaceTokens } from '@/app/pages/Board/hooks/useBoardPageSurfaceTokens'
import { BoardPageLoadedBody } from '@/app/pages/Board/components/BoardPageLoadedBody'

export function BoardPageContent() {
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
    () => projectPickerQuery.data?.items ?? [],
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
    return (
      <PageShell
        title="Доска проекта"
        description="Загрузка данных доски..."
        className={pageBg}
      >
        <PageShellHeaderSkeleton />
        <ProjectBoardSkeleton />
      </PageShell>
    )
  }

  if (!hasProjectId && showPickerSkeleton) {
    return <BoardPickerSkeleton pageBg={pageBg} />
  }

  if (!hasProjectId) {
    return (
      <BoardProjectPicker
        pageBg={pageBg}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        isDark={isDark}
        projectPickerSearch={projectPickerSearch}
        onSearchChange={setProjectPickerSearch}
        pickerProjects={pickerProjects}
        pickerProjectsAll={pickerProjectsAll}
        projectPickerQuery={projectPickerQuery}
        onOpenProject={(id) => navigate(`/board/${id}`)}
      />
    )
  }

  if (boardQuery.isError && !projectBoardView) {
    return (
      <PageShell
        title="Доска проекта"
        description="Не удалось загрузить данные доски."
        className={pageBg}
        actions={
          <button
            onClick={() => boardQuery.refetch()}
            className="rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
          >
            Повторить
          </button>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-black/10 bg-white/60 p-10 text-center dark:border-white/10 dark:bg-[#273142]">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className={`text-lg font-bold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`max-w-xl text-sm ${textSecondary}`}>
            {boardQuery.error instanceof Error
              ? boardQuery.error.message
              : 'Не удалось получить данные доски. Попробуйте обновить страницу.'}
          </p>
        </div>
      </PageShell>
    )
  }

  if (!projectBoardView) {
    return null
  }

  const projectMembers = projectBoardView.members
  const currentUserMember = user ? projectMembers.find((m) => m.userId === user.id) : undefined
  const canEditTasks =
    currentUserMember?.role === ProjectRole.TEAM_LEAD ||
    currentUserTeamMember?.teamRole === TeamRole.OWNER

  return (
    <PageShell
      title={projectBoardView.project.name}
      description={`Канбан-доска · ${projectBoardView.tasks.length} задач`}
      className={pageBg}
      actions={
        <BoardPageActions
          isDark={isDark}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode((m) => (m === 'board' ? 'list' : 'board'))}
          isRefreshing={boardQuery.isFetching}
          onRefresh={() => boardQuery.refetch()}
          canEditTasks={canEditTasks}
          onCreateTask={taskForm.openTaskCreation}
          onOpenProjectPicker={() => {
            clearLastBoardProjectId()
            navigate('/board/0?choose=1')
          }}
        />
      }
    >
      <BoardPageLoadedBody
        projectBoardView={projectBoardView}
        boardQuery={boardQuery}
        isDark={isDark}
        columnBg={columnBg}
        cardBg={cardBg}
        cardBorder={cardBorder}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        canEditTasks={canEditTasks}
        viewMode={viewMode}
        openedTaskMenuId={openedTaskMenuId}
        setOpenedTaskMenuId={setOpenedTaskMenuId}
        kanbanColumnModal={kanbanColumnModal}
        setKanbanColumnModal={setKanbanColumnModal}
        isRiskModalOpen={isRiskModalOpen}
        setIsRiskModalOpen={setIsRiskModalOpen}
        isTaskDetailsOpen={isTaskDetailsOpen}
        setIsTaskDetailsOpen={setIsTaskDetailsOpen}
        selectedTaskForDetails={selectedTaskForDetails}
        setSelectedTaskForDetails={setSelectedTaskForDetails}
        selectedTaskForRisk={selectedTaskForRisk}
        setSelectedTaskForRisk={setSelectedTaskForRisk}
        taskForm={taskForm}
        mutations={{
          pendingTaskActions,
          changeTaskStatusMutation,
          deleteTaskMutation,
        }}
      />
    </PageShell>
  )
}
