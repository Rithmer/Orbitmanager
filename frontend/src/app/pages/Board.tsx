import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  LoaderCircle,
  Eye,
  Edit3,
  MoreHorizontal,
  Plus,
  Tag,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router'
import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../components/Modal'
import { PageShell, PageShellHeaderSkeleton, RefreshBadge } from '../components/PageShell'
import { useTheme } from '../context/useTheme'
import { tasksApi } from '../api/tasks'
import { formatLocalDateInput, toLocalEndOfDayIso } from '../utils/dateTime'
import { appQueryKeys } from '../query'
import { AccountRole, ALLOWED_TASK_TRANSITIONS, PROJECT_ROLE_LABELS, ProjectRole, RISK_LEVEL_LABELS, RiskLevel, TASK_STATUS_LABELS, TaskStatus } from '../types'
import { useAuth } from '../context/useAuth'
import { useProjectBoardViewQuery, type ProjectBoardTask } from '../features/board'
import { PROJECT_BOARD_COLUMNS, getColumnTasks, getOverdueLabel, getRiskBadgeClasses } from '../features/board/board-view.constants'
import { ProjectBoardSkeleton } from '../features/board/board-view'
import type { TaskRiskOutput } from '../types'

type TaskPendingAction = 'status' | 'delete'

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString('ru-RU')
}

function formatDateTimeLabel(value: string) {
  return new Date(value).toLocaleString('ru-RU')
}

export function Board() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { projectId: projectIdParam } = useParams()
  const projectId = Number(projectIdParam)
  const hasProjectId = Number.isInteger(projectId) && projectId > 0

  const boardQuery = useProjectBoardViewQuery(hasProjectId ? projectId : null)
  const projectBoardView = boardQuery.data

  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false)
  const [isTaskDetailsOpen, setIsTaskDetailsOpen] = useState(false)
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<ProjectBoardTask | null>(null)
  const [selectedTaskForEditing, setSelectedTaskForEditing] = useState<ProjectBoardTask | null>(null)
  const [selectedTaskForRisk, setSelectedTaskForRisk] = useState<{ task: ProjectBoardTask; risk: TaskRiskOutput } | null>(null)
  const [openedTaskMenuId, setOpenedTaskMenuId] = useState<number | null>(null)
  const [taskFormName, setTaskFormName] = useState('')
  const [taskFormDescription, setTaskFormDescription] = useState('')
  const [taskFormDeadline, setTaskFormDeadline] = useState('')
  const [taskFormDifficulty, setTaskFormDifficulty] = useState('3')
  const [taskFormAssigneeId, setTaskFormAssigneeId] = useState('')
  const [taskFormStatus, setTaskFormStatus] = useState<TaskStatus>(TaskStatus.NEW)
  const [taskFormError, setTaskFormError] = useState('')
  const [pendingTaskActions, setPendingTaskActions] = useState<Record<number, TaskPendingAction>>({})

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const columnBg = isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  const setTaskPendingAction = (taskId: number, action: TaskPendingAction) => {
    setPendingTaskActions((current) => ({
      ...current,
      [taskId]: action,
    }))
  }

  const clearTaskPendingAction = (taskId: number) => {
    setPendingTaskActions((current) => {
      if (!(taskId in current)) {
        return current
      }

      const next = { ...current }
      delete next[taskId]
      return next
    })
  }

  const invalidateBoardData = async () => {
    if (!hasProjectId) {
      return
    }

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: appQueryKeys.projects.boardView(projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: ['calendar', 'month-view'],
      }),
    ])
  }

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!hasProjectId) {
        throw new Error('Проект не выбран')
      }

      return tasksApi.create({
        projectId,
        name: taskFormName.trim(),
        description: taskFormDescription.trim() || undefined,
        deadline: toLocalEndOfDayIso(taskFormDeadline),
        difficulty: Number(taskFormDifficulty),
        assigneeId: taskFormAssigneeId ? Number(taskFormAssigneeId) : undefined,
      })
    },
    onSuccess: async () => {
      setIsTaskFormOpen(false)
      resetTaskForm()
      await invalidateBoardData()
    },
    onError: (error) => {
      setTaskFormError(error instanceof Error ? error.message : 'Ошибка создания задачи')
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTaskForEditing) {
        throw new Error('Задача не выбрана')
      }

      return tasksApi.update(selectedTaskForEditing.id, {
        name: taskFormName.trim(),
        description: taskFormDescription.trim() || undefined,
        deadline: taskFormDeadline ? toLocalEndOfDayIso(taskFormDeadline) : undefined,
        difficulty: Number(taskFormDifficulty),
        status: taskFormStatus,
        assigneeId: taskFormAssigneeId ? Number(taskFormAssigneeId) : null,
      })
    },
    onSuccess: async () => {
      setIsTaskFormOpen(false)
      setSelectedTaskForEditing(null)
      resetTaskForm()
      await invalidateBoardData()
    },
    onError: (error) => {
      setTaskFormError(error instanceof Error ? error.message : 'Ошибка обновления задачи')
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => tasksApi.delete(taskId),
    onMutate: (taskId) => {
      setTaskPendingAction(taskId, 'delete')
    },
    onSuccess: async () => {
      setOpenedTaskMenuId(null)
      await invalidateBoardData()
    },
    onSettled: (_data, _error, taskId) => {
      clearTaskPendingAction(taskId)
    },
  })

  const changeTaskStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) =>
      tasksApi.update(taskId, { status }),
    onMutate: ({ taskId }) => {
      setTaskPendingAction(taskId, 'status')
    },
    onSuccess: async () => {
      setOpenedTaskMenuId(null)
      await invalidateBoardData()
    },
    onSettled: (_data, _error, variables) => {
      clearTaskPendingAction(variables.taskId)
    },
  })

  if (!hasProjectId) {
    return (
      <PageShell
        title="Доска проекта"
        description="Выберите проект для просмотра канбан-доски."
        className={pageBg}
        actions={
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
          >
            <ArrowLeft className="h-4 w-4" />
            К проектам
          </button>
        }
      >
        <div className="rounded-xl border border-dashed border-black/10 bg-white/60 p-8 text-center dark:border-white/10 dark:bg-[#273142]">
          <p className={`text-lg font-bold ${textPrimary}`}>Проект не выбран</p>
          <p className={`mt-2 text-sm ${textSecondary}`}>Перейдите в список проектов и откройте доску нужного проекта.</p>
        </div>
      </PageShell>
    )
  }

  if (boardQuery.isLoading && !projectBoardView) {
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
  const canEditTasks = user?.accountRole === AccountRole.ADMIN || user?.accountRole === AccountRole.MEMBER
  const taskAssigneeOptions = [
    { value: '', label: 'Не назначен' },
    ...projectMembers.map((member) => ({
      value: String(member.userId),
      label: `${member.user.fullName} (${PROJECT_ROLE_LABELS[member.role as ProjectRole] ?? member.role})`,
    })),
  ]
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
    setTaskFormAssigneeId(task.assigneeId ? String(task.assigneeId) : '')
    setTaskFormStatus(task.status as TaskStatus)
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

    if (selectedTaskForEditing) {
      await updateTaskMutation.mutateAsync()
      return
    }

    await createTaskMutation.mutateAsync()
  }

  function resetTaskForm() {
    setTaskFormName('')
    setTaskFormDescription('')
    setTaskFormDeadline('')
    setTaskFormDifficulty('3')
    setTaskFormAssigneeId('')
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
            onClick={() => navigate('/projects')}
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
              isDark
                ? 'border-[#313d4f] text-[#f4f3f2] hover:bg-[#273142]'
                : 'border-gray-200 text-[#202224] hover:bg-gray-50'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            К проектам
          </button>
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

      <div className="grid grid-cols-1 gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-4 grid-slide-in-up">
        {boardColumns.map((column, columnIndex) => {
          const columnTasks = column.tasks

          return (
            <section
              key={column.status}
              className={`${columnBg} rounded-xl p-4 stagger-row`}
              style={{ animationDelay: `${columnIndex * 75}ms` }}
            >
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: column.accent }} />
                <span className={`text-sm font-bold ${textPrimary}`}>{column.title}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  style={{ backgroundColor: `${column.accent}20`, color: column.accent }}
                >
                  {column.tasks.length}
                </span>
                {column.isRefreshing && (
                  <span
                    className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isDark ? 'bg-white/5 text-[#94a3b8]' : 'bg-black/5 text-[#737373]'
                    }`}
                  >
                    <LoaderCircle className="h-3 w-3 animate-spin" />
                    {columnTasks.some((task) => pendingTaskActions[task.id] !== undefined)
                      ? 'Сохраняем'
                      : 'Обновление'}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {columnTasks.map((task, taskIndex) => {
                  const risk = projectBoardView.riskByTaskId[task.id]
                  const overdue = getOverdueLabel(task)
                  const canTransition = (ALLOWED_TASK_TRANSITIONS[task.status as TaskStatus] ?? []) as TaskStatus[]
                  const pendingAction = pendingTaskActions[task.id]
                  const isTaskBusy = pendingAction !== undefined

                  return (
                    <article
                      key={task.id}
                      aria-busy={isTaskBusy}
                      className={`${cardBg} border ${cardBorder} rounded-xl p-4 shadow-sm transition-all duration-200 card-hover stagger-card ${
                        isTaskBusy ? 'opacity-80' : ''
                      }`}
                      style={{ animationDelay: `${columnIndex * 75 + taskIndex * 50}ms` }}
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold leading-snug ${textPrimary}`}>{task.name}</h3>
                        <div className="flex items-start gap-2">
                          {isTaskBusy && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                isDark ? 'bg-[#1c2534] text-[#94a3b8]' : 'bg-gray-100 text-[#737373]'
                              }`}
                            >
                              <LoaderCircle className="h-3 w-3 animate-spin" />
                              {pendingAction === 'delete' ? 'Удаление' : 'Перевод'}
                            </span>
                          )}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenedTaskMenuId(openedTaskMenuId === task.id ? null : task.id)
                              }
                              disabled={isTaskBusy}
                              className={`shrink-0 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${textSecondary}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            {openedTaskMenuId === task.id && !isTaskBusy && (
                              <div
                                className={`dropdown-enter absolute right-0 top-6 z-20 w-52 overflow-hidden rounded-xl border shadow-xl ${
                                  isDark
                                    ? 'border-[#313d4f] bg-[#273142]'
                                    : 'border-[#e8e8e8] bg-white'
                                }`}
                              >
                                <button
                                  onClick={() => {
                                    openTaskDetails(task)
                                    setOpenedTaskMenuId(null)
                                  }}
                                  className={`flex w-full items-center gap-2 px-3 py-2 text-xs ${textPrimary} ${
                                    isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Подробности
                                </button>
                                {canEditTasks && (
                                  <button
                                    onClick={() => {
                                      openTaskEditing(task)
                                      setOpenedTaskMenuId(null)
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs ${textPrimary} ${
                                      isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <Edit3 className="h-3.5 w-3.5" />
                                    Редактировать
                                  </button>
                                )}
                                {risk && (
                                  <button
                                    onClick={() => {
                                      openTaskRisk(task)
                                      setOpenedTaskMenuId(null)
                                    }}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs ${textPrimary} ${
                                      isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Оценка рисков
                                  </button>
                                )}
                                {canEditTasks && canTransition.length > 0 && (
                                  <div className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
                                    <p className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${textSecondary}`}>
                                      Перевести в
                                    </p>
                                    {canTransition.map((transitionStatus) => (
                                      <button
                                        key={transitionStatus}
                                        onClick={() =>
                                          changeTaskStatusMutation.mutate({
                                            taskId: task.id,
                                            status: transitionStatus,
                                          })
                                        }
                                        disabled={isTaskBusy}
                                        className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${textPrimary} ${
                                          isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                                        }`}
                                      >
                                        {TASK_STATUS_LABELS[transitionStatus]}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {canEditTasks && (
                                  <div className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
                                    <button
                                      onClick={() => deleteTaskMutation.mutate(task.id)}
                                      disabled={isTaskBusy}
                                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                        isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                                      }`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      Удалить
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {task.description && (
                        <p className={`mb-3 line-clamp-2 text-xs leading-relaxed ${textSecondary}`}>
                          {task.description}
                        </p>
                      )}

                      <div className="mb-3 flex flex-wrap gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            isDark ? 'bg-[#4880ff]/15 text-[#4880ff]' : 'bg-blue-50 text-[#4880ff]'
                          }`}
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {task.difficulty}/5
                        </span>
                        {risk && risk.riskLevel !== RiskLevel.LOW && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${getRiskBadgeClasses(risk.riskLevel).background} ${getRiskBadgeClasses(risk.riskLevel).text}`}
                          >
                            <AlertTriangle className="h-2.5 w-2.5" />
                            {RISK_LEVEL_LABELS[risk.riskLevel]}
                          </span>
                        )}
                        {overdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
                            Просрочено
                          </span>
                        )}
                      </div>

                      <div className={`mt-2 flex items-center justify-between text-xs ${textSecondary}`}>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDateLabel(task.deadline)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          <span>{task.assignee?.fullName ?? 'Не назначен'}</span>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      <Modal
        open={isTaskFormOpen}
        onClose={() => {
          setIsTaskFormOpen(false)
          setSelectedTaskForEditing(null)
          resetTaskForm()
        }}
        title={selectedTaskForEditing ? 'Редактировать задачу' : 'Новая задача'}
        maxWidth="max-w-xl"
      >
        <ErrorMessage message={taskFormError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void submitTaskForm()
          }}
          className="space-y-4"
        >
          <InputField
            label="Название"
            value={taskFormName}
            onChange={setTaskFormName}
            required
            placeholder="Название задачи"
          />
          <InputField
            label="Описание"
            value={taskFormDescription}
            onChange={setTaskFormDescription}
            placeholder="Подробности задачи"
          />
          <InputField
            label="Дедлайн"
            value={taskFormDeadline}
            onChange={setTaskFormDeadline}
            type="date"
            required
          />
          <SelectField
            label="Сложность"
            value={taskFormDifficulty}
            onChange={setTaskFormDifficulty}
            options={[
              { value: '1', label: '1' },
              { value: '2', label: '2' },
              { value: '3', label: '3' },
              { value: '4', label: '4' },
              { value: '5', label: '5' },
            ]}
          />
          <SelectField
            label="Исполнитель"
            value={taskFormAssigneeId}
            onChange={setTaskFormAssigneeId}
            options={taskAssigneeOptions}
          />
          <SelectField
            label="Статус"
            value={taskFormStatus}
            onChange={(value) => setTaskFormStatus(value as TaskStatus)}
            options={Object.values(TaskStatus).map((status) => ({
              value: status,
              label: TASK_STATUS_LABELS[status],
            }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsTaskFormOpen(false)
                setSelectedTaskForEditing(null)
                resetTaskForm()
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}
            >
              Отмена
            </button>
            <SubmitButton loading={createTaskMutation.isPending || updateTaskMutation.isPending}>
              {selectedTaskForEditing ? 'Сохранить' : 'Создать'}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={isTaskDetailsOpen && selectedTaskForDetails !== null}
        onClose={() => {
          setIsTaskDetailsOpen(false)
          setSelectedTaskForDetails(null)
        }}
        title="Подробности задачи"
        maxWidth="max-w-2xl"
      >
        {selectedTaskForDetails ? (
          <div className="space-y-4">
            <div>
              <h3 className={`text-lg font-bold ${textPrimary}`}>{selectedTaskForDetails.name}</h3>
              <p className={`mt-1 text-sm ${textSecondary}`}>{selectedTaskForDetails.description || 'Описание отсутствует'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Дедлайн</p>
                <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>{formatDateTimeLabel(selectedTaskForDetails.deadline)}</p>
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Статус</p>
                <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>{TASK_STATUS_LABELS[selectedTaskForDetails.status as TaskStatus]}</p>
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Исполнитель</p>
                <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>{selectedTaskForDetails.assignee?.fullName ?? 'Не назначен'}</p>
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Сложность</p>
                <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>{selectedTaskForDetails.difficulty}/5</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsTaskDetailsOpen(false)
                  setSelectedTaskForDetails(null)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}
              >
                Закрыть
              </button>
              {canEditTasks && (
                <button
                  type="button"
                  onClick={() => {
                    openTaskEditing(selectedTaskForDetails)
                    setIsTaskDetailsOpen(false)
                  }}
                  className="rounded-lg bg-[#4880ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
                >
                  Редактировать
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isRiskModalOpen && selectedTaskForRisk !== null}
        onClose={() => {
          setIsRiskModalOpen(false)
          setSelectedTaskForRisk(null)
        }}
        title="Оценка рисков"
        maxWidth="max-w-2xl"
      >
        {selectedTaskForRisk ? (
          <div className="space-y-4">
            <div>
              <h3 className={`text-lg font-bold ${textPrimary}`}>{selectedTaskForRisk.task.name}</h3>
              <p className={`mt-1 text-sm ${textSecondary}`}>{selectedTaskForRisk.task.description || 'Описание отсутствует'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Уровень</p>
                <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>{RISK_LEVEL_LABELS[selectedTaskForRisk.risk.riskLevel]}</p>
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Вероятность</p>
                <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>{Math.round(selectedTaskForRisk.risk.delayProbability * 100)}%</p>
              </div>
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Прогноз</p>
                <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>{formatDateLabel(selectedTaskForRisk.risk.predictedCompletionDate)}</p>
              </div>
            </div>
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Рекомендация</p>
              <p className={`mt-1 text-sm ${textPrimary}`}>{selectedTaskForRisk.risk.recommendation}</p>
            </div>
            {(selectedTaskForRisk.risk.riskFactors?.length ?? 0) > 0 && (
              <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Факторы риска</p>
                <ul className={`mt-2 space-y-2 text-sm ${textPrimary}`}>
                  {(selectedTaskForRisk.risk.riskFactors ?? []).map((factor) => (
                    <li key={factor} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4880ff]" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsRiskModalOpen(false)
                  setSelectedTaskForRisk(null)
                }}
                className="rounded-lg bg-[#4880ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
              >
                Закрыть
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </PageShell>
  )
}
