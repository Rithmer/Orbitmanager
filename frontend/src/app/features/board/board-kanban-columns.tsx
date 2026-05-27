import {
  Calendar,
  LoaderCircle,
  Tag,
  User as UserIcon,
} from 'lucide-react'
import { TaskStatus } from '@/app/types'
import {
  getOverdueLabel,
  KANBAN_COLUMN_PREVIEW_TASKS,
} from '@/app/features/board/board-view.constants'
import { formatBoardDateLabel } from '@/app/features/board/board-page-formatters'
import type { ProjectBoardTask, ProjectBoardView } from '@/app/features/board/types'

export type BoardColumnVm = {
  status: TaskStatus
  title: string
  accent: string
  tasks: ProjectBoardTask[]
  isRefreshing: boolean
}

type TaskPendingAction = 'status' | 'delete'

type BoardKanbanColumnsProps = {
  columns: BoardColumnVm[]
  projectBoardView: ProjectBoardView
  isDark: boolean
  columnBg: string
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
  openedTaskMenuId: number | null
  onToggleTaskMenu: (taskId: number | null) => void
  pendingTaskActions: Record<number, TaskPendingAction>
  canEditTasks: boolean
  formatTaskAssigneesShort: (task: ProjectBoardTask) => string
  onOpenTaskDetails: (task: ProjectBoardTask) => void
  onOpenTaskEditing: (task: ProjectBoardTask) => void
  onOpenTaskRisk: (task: ProjectBoardTask) => void
  onChangeTaskStatus: (taskId: number, status: TaskStatus) => void
  onDeleteTask: (taskId: number) => void
  onOpenColumnModal: (title: string, tasks: ProjectBoardTask[]) => void
}

export function BoardKanbanColumns({
  columns,
  isDark,
  columnBg,
  cardBg,
  cardBorder,
  textPrimary,
  textSecondary,
  pendingTaskActions,
  formatTaskAssigneesShort,
  onOpenTaskDetails,
  onOpenColumnModal,
}: BoardKanbanColumnsProps) {
  return (
    <div className="isolate grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 grid-slide-in-up page-load-stagger">
      {columns.map((column, columnIndex) => {
        const columnTasks = column.tasks
        const previewTasks = columnTasks.slice(0, KANBAN_COLUMN_PREVIEW_TASKS)
        const hiddenKanbanCount = Math.max(0, columnTasks.length - previewTasks.length)

        return (
          <section
            key={column.status}
            className={`${columnBg} relative rounded-xl p-4 stagger-row overflow-visible z-0`}
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
              {previewTasks.map((task, taskIndex) => {
                const overdue = getOverdueLabel(task)
                const pendingAction = pendingTaskActions[task.id]
                const isTaskBusy = pendingAction !== undefined

                return (
                  <article
                    key={task.id}
                    aria-busy={isTaskBusy}
                    className={`${cardBg} border ${cardBorder} rounded-xl p-4 shadow-sm transition-all duration-200 stagger-card ${
                      isTaskBusy ? 'opacity-80' : ''
                    } relative`}
                    style={{ animationDelay: `${columnIndex * 75 + taskIndex * 50}ms` }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <button
                        type="button"
                        disabled={isTaskBusy}
                        onClick={() => onOpenTaskDetails(task)}
                        className={`text-sm font-semibold leading-snug text-left transition-colors hover:text-[#4880ff] disabled:cursor-not-allowed disabled:opacity-50 ${textPrimary}`}
                      >
                        {task.name}
                      </button>
                      {isTaskBusy && (
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isDark ? 'bg-[#1c2534] text-[#94a3b8]' : 'bg-gray-100 text-[#737373]'
                          }`}
                        >
                          <LoaderCircle className="h-3 w-3 animate-spin" />
                          {pendingAction === 'delete' ? 'Удаление' : 'Перевод'}
                        </span>
                      )}
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
                      {overdue && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-500">
                          Просрочено
                        </span>
                      )}
                    </div>

                    <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${textSecondary}`}>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatBoardDateLabel(task.deadline)}</span>
                      </div>
                      <div className="flex min-w-0 items-center gap-1">
                        <UserIcon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{formatTaskAssigneesShort(task)}</span>
                      </div>
                    </div>
                  </article>
                )
              })}
              {hiddenKanbanCount > 0 ? (
                <button
                  type="button"
                  onClick={() => onOpenColumnModal(column.title, columnTasks)}
                  className={`w-full rounded-lg px-2 py-2 text-left text-xs font-semibold transition-colors ${
                    isDark ? 'text-[#f4f3f2] hover:bg-[#273142]' : 'text-[#202224] hover:bg-gray-50'
                  }`}
                >
                  +{hiddenKanbanCount} ещё
                </button>
              ) : null}
            </div>
          </section>
        )
      })}
    </div>
  )
}
