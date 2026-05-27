import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/app/api/tasks'
import { appQueryKeys } from '@/app/query'
import { TaskStatus } from '@/app/types'
import { toLocalEndOfDayIso } from '@/app/utils/dateTime'

type TaskPendingAction = 'status' | 'delete'

type CreateTaskInput = {
  projectId: number
  name: string
  description: string
  deadline: string
  difficulty: string
  assigneeIds: number[]
}

type UpdateTaskInput = {
  taskId: number
  name: string
  description: string
  deadline: string
  difficulty: string
  status: TaskStatus
  assigneeIds: number[]
}

type UseBoardMutationsParams = {
  projectId: number
  hasProjectId: boolean
  onCreateSuccess: () => void
  onUpdateSuccess: () => void
}

export function useBoardMutations({
  projectId,
  hasProjectId,
  onCreateSuccess,
  onUpdateSuccess,
}: UseBoardMutationsParams) {
  const queryClient = useQueryClient()
  const [pendingTaskActions, setPendingTaskActions] = useState<Record<number, TaskPendingAction>>({})

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
        queryKey: appQueryKeys.calendar.monthView(),
      }),
    ])
  }

  const createTaskMutation = useMutation({
    mutationFn: async (input: CreateTaskInput) =>
      tasksApi.create({
        projectId: input.projectId,
        name: input.name.trim(),
        description: input.description.trim() || undefined,
        deadline: toLocalEndOfDayIso(input.deadline),
        difficulty: Number(input.difficulty),
        assigneeIds: input.assigneeIds,
      }),
    onSuccess: async () => {
      onCreateSuccess()
      await invalidateBoardData()
    },
  })

  const updateTaskMutation = useMutation({
    mutationFn: async (input: UpdateTaskInput) =>
      tasksApi.update(input.taskId, {
        name: input.name.trim(),
        description: input.description.trim() || undefined,
        deadline: input.deadline ? toLocalEndOfDayIso(input.deadline) : undefined,
        difficulty: Number(input.difficulty),
        status: input.status,
        assigneeIds: input.assigneeIds,
      }),
    onSuccess: async () => {
      onUpdateSuccess()
      await invalidateBoardData()
    },
  })

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => tasksApi.delete(taskId),
    onMutate: (taskId) => {
      setTaskPendingAction(taskId, 'delete')
    },
    onSuccess: async () => {
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
      await invalidateBoardData()
    },
    onSettled: (_data, _error, variables) => {
      clearTaskPendingAction(variables.taskId)
    },
  })

  return {
    pendingTaskActions,
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    changeTaskStatusMutation,
  }
}
