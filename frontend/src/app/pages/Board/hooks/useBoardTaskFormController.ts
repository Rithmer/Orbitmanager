import { useState } from 'react'
import { formatLocalDateInput } from '@/app/utils/dateTime'
import { TaskStatus } from '@/app/types'
import type { ProjectBoardTask } from '@/app/features/board'

type TaskFormState = {
  name: string
  description: string
  deadline: string
  difficulty: string
  assigneeIds: number[]
  status: TaskStatus
  error: string
}

type CreateTaskMutation = {
  mutateAsync: (payload: {
    projectId: number
    name: string
    description: string
    deadline: string
    difficulty: string
    assigneeIds: number[]
  }) => Promise<unknown>
  isPending: boolean
}

type UpdateTaskMutation = {
  mutateAsync: (payload: {
    taskId: number
    name: string
    description: string
    deadline: string
    difficulty: string
    status: TaskStatus
    assigneeIds: number[]
  }) => Promise<unknown>
  isPending: boolean
}

const INITIAL_TASK_FORM_STATE: TaskFormState = {
  name: '',
  description: '',
  deadline: '',
  difficulty: '3',
  assigneeIds: [],
  status: TaskStatus.NEW,
  error: '',
}

type Params = {
  hasProjectId: boolean
  projectId: number
  createTaskMutation: CreateTaskMutation
  updateTaskMutation: UpdateTaskMutation
}

export function useBoardTaskFormController({
  hasProjectId,
  projectId,
  createTaskMutation,
  updateTaskMutation,
}: Params) {
  const [taskFormState, setTaskFormState] = useState<TaskFormState>(INITIAL_TASK_FORM_STATE)
  const [selectedTaskForEditing, setSelectedTaskForEditing] = useState<ProjectBoardTask | null>(null)
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)

  function resetTaskForm() {
    setTaskFormState(INITIAL_TASK_FORM_STATE)
  }

  const openTaskCreation = () => {
    setSelectedTaskForEditing(null)
    resetTaskForm()
    const defaultDeadline = new Date()
    defaultDeadline.setDate(defaultDeadline.getDate() + 7)
    setTaskFormState((prev) => ({
      ...prev,
      status: TaskStatus.NEW,
      deadline: formatLocalDateInput(defaultDeadline),
    }))
    setIsTaskFormOpen(true)
  }

  const openTaskEditing = (task: ProjectBoardTask) => {
    setSelectedTaskForEditing(task)
    const assigneeIds =
      task.assigneeIds && task.assigneeIds.length > 0
        ? task.assigneeIds
        : typeof task.assigneeId === 'number' && task.assigneeId > 0
          ? [task.assigneeId]
          : task.assignee
            ? [task.assignee.id]
            : []

    setTaskFormState({
      name: task.name,
      description: task.description,
      deadline: formatLocalDateInput(task.deadline),
      difficulty: String(task.difficulty),
      assigneeIds,
      status: task.status,
      error: '',
    })
    setIsTaskFormOpen(true)
  }

  const closeTaskForm = () => {
    setIsTaskFormOpen(false)
    setSelectedTaskForEditing(null)
    resetTaskForm()
  }

  async function submitTaskForm() {
    setTaskFormState((prev) => ({ ...prev, error: '' }))

    try {
      if (selectedTaskForEditing) {
        await updateTaskMutation.mutateAsync({
          taskId: selectedTaskForEditing.id,
          name: taskFormState.name,
          description: taskFormState.description,
          deadline: taskFormState.deadline,
          difficulty: taskFormState.difficulty,
          status: taskFormState.status,
          assigneeIds: taskFormState.assigneeIds,
        })
        closeTaskForm()
        return
      }

      if (!hasProjectId) {
        throw new Error('Проект не выбран')
      }

      await createTaskMutation.mutateAsync({
        projectId,
        name: taskFormState.name,
        description: taskFormState.description,
        deadline: taskFormState.deadline,
        difficulty: taskFormState.difficulty,
        assigneeIds: taskFormState.assigneeIds,
      })
      closeTaskForm()
    } catch (error) {
      setTaskFormState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Ошибка сохранения задачи',
      }))
    }
  }

  return {
    taskFormState,
    setTaskFormState,
    selectedTaskForEditing,
    isTaskFormOpen,
    openTaskCreation,
    openTaskEditing,
    closeTaskForm,
    submitTaskForm,
    createOrUpdatePending: createTaskMutation.isPending || updateTaskMutation.isPending,
  }
}

export type BoardTaskFormControllerModel = ReturnType<typeof useBoardTaskFormController>
