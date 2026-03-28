import type { Dispatch, SetStateAction } from 'react'
import type { ProjectBoardMember, ProjectBoardTask } from '@/app/features/board'
import type { TaskRiskOutput, TaskStatus } from '@/app/types'

export type BoardTaskFormState = {
  assigneeIds: number[]
  deadline: string
  description: string
  difficulty: string
  error: string
  name: string
  status: TaskStatus
}

export type BoardPageModalsProps = {
  createOrUpdatePending: boolean
  formatTaskAssigneesDetail: (task: ProjectBoardTask) => string
  formatTaskAssigneesShort: (task: ProjectBoardTask) => string
  isDark: boolean
  isRiskModalOpen: boolean
  isTaskDetailsOpen: boolean
  isTaskFormOpen: boolean
  kanbanColumnModal: { title: string; tasks: ProjectBoardTask[] } | null
  projectMembers: ProjectBoardMember[]
  selectedTaskForDetails: ProjectBoardTask | null
  selectedTaskForEditing: ProjectBoardTask | null
  selectedTaskForRisk: { task: ProjectBoardTask; risk: TaskRiskOutput } | null
  taskFormState: BoardTaskFormState
  textPrimary: string
  textSecondary: string
  canEditTasks: boolean
  closeTaskForm: () => void
  onCloseColumnModal: () => void
  onCloseRiskModal: () => void
  onCloseTaskDetails: () => void
  onOpenTaskEditingFromDetails: (task: ProjectBoardTask) => void
  onSelectColumnTask: (task: ProjectBoardTask) => void
  setTaskFormState: Dispatch<SetStateAction<BoardTaskFormState>>
  submitTaskForm: () => void
}
