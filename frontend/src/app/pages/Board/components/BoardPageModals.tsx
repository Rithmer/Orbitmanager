import type { Dispatch, SetStateAction } from 'react'
import {
  BoardColumnTasksOverflowModal,
  BoardRiskModal,
  BoardTaskDetailsModal,
  BoardTaskFormModal,
  type ProjectBoardMember,
  type ProjectBoardTask,
} from '@/app/features/board'
import type { TaskRiskOutput } from '@/app/types'
import type { TaskStatus } from '@/app/types'

type BoardTaskFormState = {
  assigneeIds: number[]
  deadline: string
  description: string
  difficulty: string
  error: string
  name: string
  status: TaskStatus
}

type BoardPageModalsProps = {
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

export function BoardPageModals({
  createOrUpdatePending,
  formatTaskAssigneesDetail,
  formatTaskAssigneesShort,
  isDark,
  isRiskModalOpen,
  isTaskDetailsOpen,
  isTaskFormOpen,
  kanbanColumnModal,
  projectMembers,
  selectedTaskForDetails,
  selectedTaskForEditing,
  selectedTaskForRisk,
  taskFormState,
  textPrimary,
  textSecondary,
  canEditTasks,
  closeTaskForm,
  onCloseColumnModal,
  onCloseRiskModal,
  onCloseTaskDetails,
  onOpenTaskEditingFromDetails,
  onSelectColumnTask,
  setTaskFormState,
  submitTaskForm,
}: BoardPageModalsProps) {
  return (
    <>
      <BoardTaskFormModal
        open={isTaskFormOpen}
        onClose={closeTaskForm}
        title={selectedTaskForEditing ? 'Редактировать задачу' : 'Новая задача'}
        taskFormError={taskFormState.error}
        taskFormName={taskFormState.name}
        onTaskFormNameChange={(value) => setTaskFormState((prev) => ({ ...prev, name: value }))}
        taskFormDescription={taskFormState.description}
        onTaskFormDescriptionChange={(value) =>
          setTaskFormState((prev) => ({ ...prev, description: value }))
        }
        taskFormDeadline={taskFormState.deadline}
        onTaskFormDeadlineChange={(value) => setTaskFormState((prev) => ({ ...prev, deadline: value }))}
        taskFormDifficulty={taskFormState.difficulty}
        onTaskFormDifficultyChange={(value) =>
          setTaskFormState((prev) => ({ ...prev, difficulty: value }))
        }
        taskFormAssigneeIds={taskFormState.assigneeIds}
        onSetTaskFormAssigneeIds={(value) =>
          setTaskFormState((prev) => ({
            ...prev,
            assigneeIds: typeof value === 'function' ? value(prev.assigneeIds) : value,
          }))
        }
        taskFormStatus={taskFormState.status}
        onTaskFormStatusChange={(value) => setTaskFormState((prev) => ({ ...prev, status: value }))}
        projectMembers={projectMembers}
        isDark={isDark}
        textSecondary={textSecondary}
        onSubmit={() => void submitTaskForm()}
        createOrUpdatePending={createOrUpdatePending}
        isEditing={Boolean(selectedTaskForEditing)}
      />

      <BoardTaskDetailsModal
        open={isTaskDetailsOpen}
        task={selectedTaskForDetails}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        isDark={isDark}
        formatTaskAssigneesDetail={formatTaskAssigneesDetail}
        onClose={onCloseTaskDetails}
        canEditTasks={canEditTasks}
        onEdit={onOpenTaskEditingFromDetails}
      />

      <BoardColumnTasksOverflowModal
        modal={kanbanColumnModal}
        onClose={onCloseColumnModal}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        isDark={isDark}
        formatTaskAssigneesShort={formatTaskAssigneesShort}
        onSelectTask={onSelectColumnTask}
      />

      <BoardRiskModal
        open={isRiskModalOpen}
        selected={selectedTaskForRisk}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        isDark={isDark}
        onClose={onCloseRiskModal}
      />
    </>
  )
}
