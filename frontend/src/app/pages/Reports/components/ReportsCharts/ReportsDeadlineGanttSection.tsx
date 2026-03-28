import { PageSection } from '@/app/components/PageShell'
import { REPORTS_PAGE_CONSTANTS } from '@/app/pages/Reports/constants'
import { formatDeadline } from '@/app/pages/Reports/helpers'
import type { ReportsDeadlineGanttSectionProps } from '@/app/pages/Reports/types'

export function ReportsDeadlineGanttSection({
  tokens,
  isDark,
  ganttTasks,
  todayStart,
  maxDeadline,
  onNavigateToBoard,
}: ReportsDeadlineGanttSectionProps) {
  return (
    <PageSection title="Диаграмма дедлайнов задач" className={`card-hover xl:col-span-2 ${tokens.cardBg} border ${tokens.cardBorder}`}>
      <div className="h-[240px] overflow-y-auto pr-2 space-y-3">
        {ganttTasks.length === 0 ? (
          <p className={`text-sm ${tokens.textSecondary} text-center py-10`}>Нет данных для отображения</p>
        ) : (
          ganttTasks.map((task) => {
            const deadlineTs = new Date(task.deadline).getTime()
            const range = Math.max(1, maxDeadline - todayStart)
            const clampedEnd = Math.max(deadlineTs, todayStart + REPORTS_PAGE_CONSTANTS.DAY_MS)
            const pct = Math.max(4, Math.min(100, ((clampedEnd - todayStart) / range) * 100))
            const isOverdue = deadlineTs < todayStart
            return (
              <div key={task.id} className="space-y-1">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToBoard(task.projectId)}
                    className="text-sm font-medium truncate text-left hover:text-[#4880ff] transition-colors min-w-0 flex-1"
                  >
                    {task.name}
                  </button>
                  <span className={`text-xs ${tokens.textSecondary} whitespace-nowrap`}>{formatDeadline(task.deadline)}</span>
                </div>
                <div className={`h-2.5 rounded-full ${isDark ? 'bg-[#1f2a3b]' : 'bg-[#e5e7eb]'}`}>
                  <div
                    className={`h-2.5 rounded-full ${isOverdue ? 'bg-rose-500' : 'bg-[#4880ff]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>
    </PageSection>
  )
}
