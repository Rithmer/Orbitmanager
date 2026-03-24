import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowLeft, LoaderCircle, Plus } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import {
  PageShell,
  PageShellHeaderSkeleton,
  RefreshBadge,
} from '../components/PageShell'
import { useSmoothPageSkeleton } from '../hooks/useSmoothPageSkeleton'
import { useTheme } from '../context/useTheme'
import { formatLocalDateInput } from '../utils/dateTime'
import { ProjectRole, TaskStatus, TeamRole } from '../types'
import { useAuth } from '../context/useAuth'
import {
  BoardColumnTasksOverflowModal,
  BoardKanbanColumns,
  BoardPickerSkeleton,
  BoardProjectPicker,
  BoardRiskModal,
  BoardTaskDetailsModal,
  BoardTaskFormModal,
  BoardTaskListView,
  useBoardMutations,
  useBoardProjectPickerQuery,
  useBoardTeamMembersQuery,
  useProjectBoardViewQuery,
  type ProjectBoardTask,
} from '../features/board'
import { buildBoardAssigneeFormatters } from '../features/board/board-task-assignees'
import { PROJECT_BOARD_COLUMNS, getColumnTasks } from '../features/board/board-view.constants'
import { ProjectBoardSkeleton } from '../features/board/board-view'
import type { TaskRiskOutput } from '../types'
import {
  clearLastBoardProjectId,
  persistLastBoardProjectId,
  readLastBoardProjectId,
} from '../utils/lastBoardProjectStorage'

export function Board() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { projectId: projectIdParam } = useParams()
  const projectId = Number(projectIdParam)
  const hasProjectId = Number.isInteger(projectId) && projectId > 0
  const forceProjectPicker = searchParams.get('choose') === '1'

  const boardQuery = useProjectBoardViewQuery(hasProjectId ? projectId : null)
  const projectBoardView = boardQuery.data

  const teamIdForBoard = hasProjectId ? projectBoardView?.project.teamId ?? null : null

  // Determine whether the user is team owner to allow task creation.
  // Note: backend allows task creation for team owner even if there's no project_member row.
  const teamMembersQuery = useBoardTeamMembersQuery(teamIdForBoard, {
    enabled: Boolean(user?.id),
  })

  const currentUserTeamMember = teamMembersQuery.data?.find((m) => m.userId === user?.id)

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<ProjectBoardTask | null>(null)
  const [selectedTaskForEditing, setSelectedTaskForEditing] = useState<ProjectBoardTask | null>(null)
  const [selectedTaskForRisk, setSelectedTaskForRisk] = useState<{ task: ProjectBoardTask; risk: TaskRiskOutput } | null>(null)
  const [openedTaskMenuId, setOpenedTaskMenuId] = useState<number | null>(null)
  const [kanbanColumnModal, setKanbanColumnModal] = useState<{
    title: string
    tasks: ProjectBoardTask[]
  } | null>(null)
  const [taskFormName, setTaskFormName] = useState('')
  const [taskFormDescription, setTaskFormDescription] = useState('')
  const [taskFormDeadline, setTaskFormDeadline] = useState('')
  const [taskFormDifficulty, setTaskFormDifficulty] = useState('3')
  const [taskFormAssigneeIds, setTaskFormAssigneeIds] = useState<number[]>([])
  const [taskFormStatus, setTaskFormStatus] = useState<TaskStatus>(TaskStatus.NEW)
  const [taskFormError, setTaskFormError] = useState('')
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
    onCreateSuccess: () => {
      setIsTaskFormOpen(false)
      resetTaskForm()
    },
    onUpdateSuccess: () => {
      setIsTaskFormOpen(false)
      setSelectedTaskForEditing(null)
      resetTaskForm()
    },
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

  useEffect(() => {
    if (!hasProjectId) return
    persistLastBoardProjectId(projectId)
  }, [hasProjectId, projectId])

  useEffect(() => {
    if (hasProjectId) return
    if (forceProjectPicker) return
    if (!projectPickerQuery.isSuccess) return

    const accessibleIds = new Set(pickerProjectsAll.map((p) => p.id))
    const lastId = readLastBoardProjectId()

    if (lastId && !accessibleIds.has(lastId)) {
      clearLastBoardProjectId()
    }

    if (lastId && accessibleIds.has(lastId)) {
      navigate(`/board/${lastId}`, { replace: true })
    }
  }, [
    forceProjectPicker,
    hasProjectId,
    navigate,
    pickerProjectsAll,
    projectPickerQuery.isSuccess,
  ])

  useEffect(() => {
    if (openedTaskMenuId === null) return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const clickedMenu = target.closest(
        `[data-task-menu-id="${openedTaskMenuId}"]`,
      )
      const clickedButton = target.closest(
        `[data-task-menu-button-id="${openedTaskMenuId}"]`,
      )

      if (!clickedMenu && !clickedButton) {
        setOpenedTaskMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [openedTaskMenuId])

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const columnBg = isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  const isInitialLoading = hasProjectId && boardQuery.isLoading && !projectBoardView
  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoading)
  const showPickerSkeleton = useSmoothPageSkeleton(
    !hasProjectId && projectPickerQuery.isPending && !projectPickerQuery.data,
  )

  const {
    pendingTaskActions,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    changeTaskStatusMutation,
  } = useBoardMutations({
    projectId,
    hasProjectId,
    onCreateSuccess: () => {
      setIsTaskFormOpen(false)
      resetTaskForm()
    },
    onUpdateSuccess: () => {
      setIsTaskFormOpen(false)
      setSelectedTaskForEditing(null)
      resetTaskForm()
    },
  })

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
  const boardTasks = projectBoardView.tasks
  const isBoardRefreshing = boardQuery.isFetching && !boardQuery.isLoading && Boolean(projectBoardView)
  const currentUserMember = user ? projectMembers.find((m) => m.userId === user.id) : undefined
  const canEditTasks =
    currentUserMember?.role === ProjectRole.TEAM_LEAD || currentUserTeamMember?.teamRole === TeamRole.OWNER

  const { formatTaskAssigneesShort, formatTaskAssigneesDetail } =
    buildBoardAssigneeFormatters(projectMembers)

  const boardColumns = PROJECT_BOARD_COLUMNS.map((column) => {
    const columnTasks = getColumnTasks(boardTasks, column.status)
    return {
      ...column,
      tasks: columnTasks,
      isRefreshing:
        isBoardRefreshing || columnTasks.some((task) => pendingTaskActions[task.id] !== undefined),
    }
  })

  const openTaskCreation = () => {
    setSelectedTaskForEditing(null)
    resetTaskForm()
    setTaskFormStatus(TaskStatus.NEW)
    const defaultDeadline = new Date()
    defaultDeadline.setDate(defaultDeadline.getDate() + 7)
    setTaskFormDeadline(formatLocalDateInput(defaultDeadline))
    setIsTaskFormOpen(true)
  }

  const openTaskEditing = (task: ProjectBoardTask) => {
    setSelectedTaskForEditing(task)
    setSelectedTaskForDetails(null)
    setTaskFormName(task.name)
    setTaskFormDescription(task.description)
    setTaskFormDeadline(formatLocalDateInput(task.deadline))
    setTaskFormDifficulty(String(task.difficulty))
    setTaskFormAssigneeIds(
      task.assigneeIds && task.assigneeIds.length > 0
        ? task.assigneeIds
        : typeof task.assigneeId === 'number' && task.assigneeId > 0
          ? [task.assigneeId]
          : task.assignee
            ? [task.assignee.id]
            : [],
    )
    setTaskFormStatus(task.status)
    setTaskFormError('')
    setIsTaskFormOpen(true)
  }

  const openTaskDetails = (task: ProjectBoardTask) => {
    setSelectedTaskForDetails(task)
    setIsTaskDetailsOpen(true)
  }

  const openTaskRisk = (task: ProjectBoardTask) => {
    const taskRisk = projectBoardView.riskByTaskId[task.id]
    if (!taskRisk) {
      return
    }

    setSelectedTaskForRisk({ task, risk: taskRisk })
    setIsRiskModalOpen(true)
  }

  async function submitTaskForm() {
    setTaskFormError('')

    try {
      if (selectedTaskForEditing) {
        await updateTaskMutation.mutateAsync({
          taskId: selectedTaskForEditing.id,
          name: taskFormName,
          description: taskFormDescription,
          deadline: taskFormDeadline,
          difficulty: taskFormDifficulty,
          status: taskFormStatus,
          assigneeIds: taskFormAssigneeIds,
        })
        return
      }

      if (!hasProjectId) {
        throw new Error('Проект не выбран')
      }

      await createTaskMutation.mutateAsync({
        projectId,
        name: taskFormName,
        description: taskFormDescription,
        deadline: taskFormDeadline,
        difficulty: taskFormDifficulty,
        assigneeIds: taskFormAssigneeIds,
      })
    } catch (error) {
      setTaskFormError(error instanceof Error ? error.message : 'Ошибка сохранения задачи')
    }
  }

  function resetTaskForm() {
    setTaskFormName('')
    setTaskFormDescription('')
    setTaskFormDeadline('')
    setTaskFormDifficulty('3')
    setTaskFormAssigneeIds([])
    setTaskFormStatus(TaskStatus.NEW)
    setTaskFormError('')
  }

  return (
    <PageShell
      title={projectBoardView.project.name}
      description={`Канбан-доска · ${boardTasks.length} задач`}
      className={pageBg}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              navigate('/board/0?choose=1')
            }}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
              isDark
                ? 'border-[#313d4f] text-[#f4f3f2] hover:bg-[#273142]'
                : 'border-gray-200 text-[#202224] hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Выбор проектов
          </button>
          <div
            className={`relative inline-flex h-10 items-stretch overflow-hidden rounded-lg border text-xs font-medium shadow-sm ${
              isDark ? 'border-[#313d4f] bg-[#0b1120]' : 'border-gray-200 bg-white'
            }`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute left-1 top-1 bottom-1 z-0 w-[calc(50%-8px)] rounded-md bg-[#4880ff] shadow-sm"
              style={{
                transform:
                  viewMode === 'board' ? 'translate3d(0, 0, 0)' : 'translate3d(calc(100% + 8px), 0, 0)',
                transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'board' ? 'list' : 'board'))}
              className={`relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-1 text-center transition-colors ${
                viewMode === 'board'
                  ? 'text-white'
                  : isDark
                    ? 'text-[#94a3b8]'
                    : 'text-[#737373]'
              }`}
            >
              Канбан
            </button>
            <button
              type="button"
              onClick={() => setViewMode((m) => (m === 'board' ? 'list' : 'board'))}
              className={`relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-1 text-center transition-colors ${
                viewMode === 'list'
                  ? 'text-white'
                  : isDark
                    ? 'text-[#94a3b8]'
                    : 'text-[#737373]'
              }`}
            >
              Список
            </button>
          </div>
          <button
            onClick={() => boardQuery.refetch()}
            disabled={boardQuery.isFetching}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${
              isDark
                ? 'border-[#313d4f] text-[#94a3b8] hover:text-[#f4f3f2] hover:bg-[#273142]'
                : 'border-gray-200 text-[#737373] hover:bg-gray-50'
            }`}
          >
            {boardQuery.isFetching ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
            Обновить
          </button>
          {canEditTasks && (
            <button
              onClick={openTaskCreation}
              className="inline-flex items-center gap-2 rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
            >
              <Plus className="h-4 w-4" />
              Добавить задачу
            </button>
          )}
        </div>
      }
    >
      <div className="mb-4 flex items-center justify-end">
        <RefreshBadge isRefreshing={isBoardRefreshing} label="Обновление доски" />
      </div>


      {viewMode === 'board' ? (
        <BoardKanbanColumns
          columns={boardColumns}
          projectBoardView={projectBoardView}
          isDark={isDark}
          columnBg={columnBg}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          openedTaskMenuId={openedTaskMenuId}
          onToggleTaskMenu={setOpenedTaskMenuId}
          pendingTaskActions={pendingTaskActions}
          canEditTasks={canEditTasks}
          formatTaskAssigneesShort={formatTaskAssigneesShort}
          onOpenTaskDetails={openTaskDetails}
          onOpenTaskEditing={openTaskEditing}
          onOpenTaskRisk={openTaskRisk}
          onChangeTaskStatus={(taskId, status) => {
            setOpenedTaskMenuId(null)
            changeTaskStatusMutation.mutate({ taskId, status })
          }}
          onDeleteTask={(taskId) => {
            setOpenedTaskMenuId(null)
            deleteTaskMutation.mutate(taskId)
          }}
          onOpenColumnModal={(title, tasks) => setKanbanColumnModal({ title, tasks })}
        />
      ) : (
        <BoardTaskListView
          boardTasks={boardTasks}
          projectBoardView={projectBoardView}
          isDark={isDark}
          cardBorder={cardBorder}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          formatTaskAssigneesShort={formatTaskAssigneesShort}
          onOpenTaskDetails={openTaskDetails}
        />
      )}

      <BoardTaskFormModal
        open={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false)
          setSelectedTaskForEditing(null)
          resetTaskForm()
        }}
        title={selectedTaskForEditing ? 'Редактировать задачу' : 'Новая задача'}
        taskFormError={taskFormError}
        taskFormName={taskFormName}
        onTaskFormNameChange={setTaskFormName}
        taskFormDescription={taskFormDescription}
        onTaskFormDescriptionChange={setTaskFormDescription}
        taskFormDeadline={taskFormDeadline}
        onTaskFormDeadlineChange={setTaskFormDeadline}
        taskFormDifficulty={taskFormDifficulty}
        onTaskFormDifficultyChange={setTaskFormDifficulty}
        taskFormAssigneeIds={taskFormAssigneeIds}
        onSetTaskFormAssigneeIds={setTaskFormAssigneeIds}
        taskFormStatus={taskFormStatus}
        onTaskFormStatusChange={setTaskFormStatus}
        projectMembers={projectMembers}
        isDark={isDark}
        textSecondary={textSecondary}
        onSubmit={() => void submitTaskForm()}
        createOrUpdatePending={createTaskMutation.isPending || updateTaskMutation.isPending}
        isEditing={Boolean(selectedTaskForEditing)}
      />

      <BoardTaskDetailsModal
        open={isTaskDetailsOpen}
        task={selectedTaskForDetails}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        isDark={isDark}
        formatTaskAssigneesDetail={formatTaskAssigneesDetail}
        onClose={() => {
          setIsTaskDetailsOpen(false)
          setSelectedTaskForDetails(null)
        }}
        canEditTasks={canEditTasks}
        onEdit={(task) => {
          openTaskEditing(task)
          setIsTaskDetailsOpen(false)
        }}
      />

      <BoardColumnTasksOverflowModal
        modal={kanbanColumnModal}
        onClose={() => setKanbanColumnModal(null)}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        isDark={isDark}
        formatTaskAssigneesShort={formatTaskAssigneesShort}
        onSelectTask={(task) => {
          openTaskDetails(task)
        }}
      />

      <BoardRiskModal
        open={isRiskModalOpen}
        selected={selectedTaskForRisk}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        isDark={isDark}
        onClose={() => {
          setIsRiskModalOpen(false)
          setSelectedTaskForRisk(null)
        }}
      />
    </PageShell>
  )
}
