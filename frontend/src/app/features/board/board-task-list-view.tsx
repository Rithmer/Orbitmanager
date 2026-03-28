import { AlertTriangle, Calendar, Tag, User as UserIcon } from 'lucide-react'
import { RISK_LEVEL_LABELS, RiskLevel } from '@/app/types'
import { getOverdueLabel, getRiskBadgeClasses, PROJECT_BOARD_COLUMNS } from '@/app/features/board/board-view.constants'
import { formatBoardDateLabel } from '@/app/features/board/board-page-formatters'
import type { ProjectBoardTask, ProjectBoardView } from '@/app/features/board/types'

type BoardTaskListViewProps = {
  boardTasks: ProjectBoardTask[]
  projectBoardView: ProjectBoardView
  isDark: boolean
  cardBorder: string
  textPrimary: string
  textSecondary: string
  formatTaskAssigneesShort: (task: ProjectBoardTask) => string
  onOpenTaskDetails: (task: ProjectBoardTask) => void
}

export function BoardTaskListView({
  boardTasks,
  projectBoardView,
  isDark,
  cardBorder,
  textPrimary,
  textSecondary,
  formatTaskAssigneesShort,
  onOpenTaskDetails,
}: BoardTaskListViewProps) {
  const riskByTaskId = projectBoardView.riskByTaskId

  return (
    <div
      className={`mt-2 overflow-hidden rounded-xl border ${cardBorder} ${
        isDark ? 'bg-[#273142]' : 'bg-white'
      }`}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div
            className={`grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.9fr)] items-center gap-3 border-b px-4 py-3 text-[11px] font-semibold uppercase tracking-wide ${
              isDark ? 'border-[#313d4f] text-[#94a3b8]' : 'border-gray-100 text-[#737373]'
            }`}
          >
            <span>Задача</span>
            <span>Статус</span>
            <span>Дедлайн</span>
            <span>Сложн.</span>
            <span>Исполнитель</span>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#313d4f]">
            {[...boardTasks]
          .sort((a, b) => {
            const order = PROJECT_BOARD_COLUMNS.map((c) => c.status)
            return order.indexOf(a.status) - order.indexOf(b.status)
          })
          .map((task) => {
            const risk = riskByTaskId[task.id]
            const overdue = getOverdueLabel(task)
            const columnMeta = PROJECT_BOARD_COLUMNS.find((c) => c.status === task.status)

            return (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTaskDetails(task)}
                className={`grid w-full grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.7fr)_minmax(0,0.9fr)] items-center gap-3 px-4 py-3 text-left text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${textPrimary}`}
              >
                <div className="space-y-1">
                  <p className="line-clamp-2 font-semibold">{task.name}</p>
                  {task.description && (
                    <p className={`line-clamp-1 text-[11px] ${textSecondary}`}>{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isDark ? 'bg-[#4880ff]/15 text-[#4880ff]' : 'bg-blue-50 text-[#4880ff]'
                      }`}
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {task.difficulty}/5
                    </span>
                    {risk && risk.riskLevel !== RiskLevel.LOW && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getRiskBadgeClasses(risk.riskLevel).background} ${getRiskBadgeClasses(risk.riskLevel).text}`}
                      >
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {RISK_LEVEL_LABELS[risk.riskLevel]}
                      </span>
                    )}
                    {overdue && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500">
                        Просрочено
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  {columnMeta && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor: `${columnMeta.accent}20`,
                        color: columnMeta.accent,
                      }}
                    >
                      {columnMeta.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>{formatBoardDateLabel(task.deadline)}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px]">
                  <Tag className="h-3 w-3" />
                  <span>{task.difficulty}/5</span>
                </div>
                <div className="flex min-w-0 items-center gap-1 text-[11px]">
                  <UserIcon className="h-3 w-3 shrink-0" />
                  <span className="truncate">{formatTaskAssigneesShort(task)}</span>
                </div>
              </button>
            )
          })}
          </div>
        </div>
      </div>
    </div>
  )
}
