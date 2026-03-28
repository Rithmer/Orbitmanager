import type { Dispatch, SetStateAction } from 'react'
import { useProjectBoardViewQuery, type ProjectBoardTask } from '@/app/features/board'
import type { TaskRiskOutput, TaskStatus } from '@/app/types'
import type { BoardTaskFormControllerModel } from '@/app/pages/Board/hooks/useBoardTaskFormController'

export type ProjectBoardViewData = NonNullable<ReturnType<typeof useProjectBoardViewQuery>['data']>

export type TaskPendingAction = 'status' | 'delete'

export type BoardMutationsSlice = {
  pendingTaskActions: Record<number, TaskPendingAction>
  changeTaskStatusMutation: { mutate: (args: { taskId: number; status: TaskStatus }) => void }
  deleteTaskMutation: { mutate: (taskId: number) => void }
}

export type BoardPageLoadedBodyProps = {
  projectBoardView: ProjectBoardViewData
  boardQuery: ReturnType<typeof useProjectBoardViewQuery>
  isDark: boolean
  columnBg: string
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
  canEditTasks: boolean
  viewMode: 'board' | 'list'
  openedTaskMenuId: number | null
  setOpenedTaskMenuId: Dispatch<SetStateAction<number | null>>
  kanbanColumnModal: { title: string; tasks: ProjectBoardTask[] } | null
  setKanbanColumnModal: Dispatch<SetStateAction<{ title: string; tasks: ProjectBoardTask[] } | null>>
  isRiskModalOpen: boolean
  setIsRiskModalOpen: Dispatch<SetStateAction<boolean>>
  isTaskDetailsOpen: boolean
  setIsTaskDetailsOpen: Dispatch<SetStateAction<boolean>>
  selectedTaskForDetails: ProjectBoardTask | null
  setSelectedTaskForDetails: Dispatch<SetStateAction<ProjectBoardTask | null>>
  selectedTaskForRisk: { task: ProjectBoardTask; risk: TaskRiskOutput } | null
  setSelectedTaskForRisk: Dispatch<
    SetStateAction<{ task: ProjectBoardTask; risk: TaskRiskOutput } | null>
  >
  taskForm: BoardTaskFormControllerModel
  mutations: BoardMutationsSlice
}
