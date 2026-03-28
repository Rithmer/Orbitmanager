import {
  BoardColumnTasksOverflowModal,
  BoardRiskModal,
  BoardTaskDetailsModal,
  BoardTaskFormModal,
} from '@/app/features/board'
import type { BoardPageModalsProps } from '@/app/pages/Board/types'

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
