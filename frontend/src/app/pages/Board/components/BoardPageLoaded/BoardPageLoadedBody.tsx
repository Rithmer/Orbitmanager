import { RefreshBadge } from '@/app/components/PageShell'
import { BoardKanbanColumns, BoardTaskListView, type ProjectBoardTask } from '@/app/features/board'
import { buildBoardAssigneeFormatters } from '@/app/features/board/board-task-assignees'
import { PROJECT_BOARD_COLUMNS, getColumnTasks } from '@/app/features/board/board-view.constants'
import type { BoardPageLoadedBodyProps } from '@/app/pages/Board/types'
import { BoardPageModals } from './BoardPageModals'

export function BoardPageLoadedBody({
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
  mutations,
}: BoardPageLoadedBodyProps) {
  const projectMembers = projectBoardView.members
  const boardTasks = projectBoardView.tasks
  const isBoardRefreshing = boardQuery.isFetching && !boardQuery.isLoading && Boolean(projectBoardView)

  const { formatTaskAssigneesShort, formatTaskAssigneesDetail } =
    buildBoardAssigneeFormatters(projectMembers)

  const boardColumns = PROJECT_BOARD_COLUMNS.map((column) => {
    const columnTasks = getColumnTasks(boardTasks, column.status)
    return {
      ...column,
      tasks: columnTasks,
      isRefreshing:
        isBoardRefreshing ||
        columnTasks.some((task) => mutations.pendingTaskActions[task.id] !== undefined),
    }
  })

  const openTaskEditing = (task: ProjectBoardTask) => {
    setSelectedTaskForDetails(null)
    taskForm.openTaskEditing(task)
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

  return (
    <>
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
          pendingTaskActions={mutations.pendingTaskActions}
          canEditTasks={canEditTasks}
          formatTaskAssigneesShort={formatTaskAssigneesShort}
          onOpenTaskDetails={openTaskDetails}
          onOpenTaskEditing={openTaskEditing}
          onOpenTaskRisk={openTaskRisk}
          onChangeTaskStatus={(taskId, status) => {
            setOpenedTaskMenuId(null)
            mutations.changeTaskStatusMutation.mutate({ taskId, status })
          }}
          onDeleteTask={(taskId) => {
            setOpenedTaskMenuId(null)
            mutations.deleteTaskMutation.mutate(taskId)
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

      <BoardPageModals
        createOrUpdatePending={taskForm.createOrUpdatePending}
        formatTaskAssigneesDetail={formatTaskAssigneesDetail}
        formatTaskAssigneesShort={formatTaskAssigneesShort}
        isDark={isDark}
        isRiskModalOpen={isRiskModalOpen}
        isTaskDetailsOpen={isTaskDetailsOpen}
        isTaskFormOpen={taskForm.isTaskFormOpen}
        kanbanColumnModal={kanbanColumnModal}
        projectMembers={projectMembers}
        selectedTaskForDetails={selectedTaskForDetails}
        selectedTaskForEditing={taskForm.selectedTaskForEditing}
        selectedTaskForRisk={selectedTaskForRisk}
        taskFormState={taskForm.taskFormState}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
        canEditTasks={canEditTasks}
        closeTaskForm={taskForm.closeTaskForm}
        onCloseColumnModal={() => setKanbanColumnModal(null)}
        onCloseRiskModal={() => {
          setIsRiskModalOpen(false)
          setSelectedTaskForRisk(null)
        }}
        onCloseTaskDetails={() => {
          setIsTaskDetailsOpen(false)
          setSelectedTaskForDetails(null)
        }}
        onOpenTaskEditingFromDetails={(task) => {
          openTaskEditing(task)
          setIsTaskDetailsOpen(false)
        }}
        onSelectColumnTask={openTaskDetails}
        setTaskFormState={taskForm.setTaskFormState}
        submitTaskForm={taskForm.submitTaskForm}
      />
    </>
  )
}
