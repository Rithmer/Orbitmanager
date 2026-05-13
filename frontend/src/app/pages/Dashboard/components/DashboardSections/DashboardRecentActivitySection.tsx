import { PageSection, RefreshBadge } from '@/app/components/PageShell'
import { AuditAction, TASK_STATUS_LABELS } from '@/app/types'
import { DASHBOARD_AUDIT_ACTION_LABELS, DASHBOARD_PAGE_CONSTANTS } from '@/app/pages/Dashboard/constants'
import { formatRecentTaskAssigneesShort } from '@/app/pages/Dashboard/helpers'
import type { DashboardRecentActivitySectionProps } from '@/app/pages/Dashboard/types'

export function DashboardRecentActivitySection({
  isAdmin,
  recentTasks,
  recentAudit,
  isRefreshing,
  isAuditRefreshing,
  ui,
  onOpenProjectBoard,
}: DashboardRecentActivitySectionProps) {
  const { cardBg, cardBorder, dividerColor, textPrimary, textSecondary, isDark, statusStyles } = ui

  return (
    <PageSection
      title={isAdmin ? 'Последние действия' : 'Последние задачи'}
      description={isAdmin
        ? 'Краткая лента последних действий пользователей в системе.'
        : 'Показаны самые свежие задачи из доступных проектов.'}
      className={`card-hover-shadow xl:col-span-2 ${cardBg} border ${cardBorder} fade-in-up`.trim()}
      isRefreshing={isRefreshing || (isAdmin && isAuditRefreshing)}
      refreshLabel={isAdmin ? 'Обновляем журнал действий' : 'Обновляем последние задачи'}
      headerSlot={isRefreshing || (isAdmin && isAuditRefreshing) ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
    >
      {isAdmin ? (
        recentAudit.length === 0 ? (
          <p className={`text-sm ${textSecondary} py-8 text-center`}>{DASHBOARD_PAGE_CONSTANTS.auditEmptyMessage}</p>
        ) : (
          <div className="space-y-1">
            {recentAudit.map((log, index) => (
              <div
                key={log.id}
                className={`flex items-center gap-4 py-3 border-b ${dividerColor} last:border-0 stagger-card`}
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="w-2 h-2 rounded-full bg-[#4880ff] shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${textPrimary}`}>
                    {log.description || `Действие ${log.action}`}
                  </div>
                  <div className={`text-xs ${textSecondary}`}>
                    {log.entityType} · Пользователь #{log.userId} · {new Date(log.timestamp).toLocaleString('ru-RU')}
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    log.action === AuditAction.DELETE ? 'text-red-500 bg-red-500/10' : 'text-[#4880ff] bg-[#4880ff]/10'
                  }`}
                >
                  {DASHBOARD_AUDIT_ACTION_LABELS[log.action] ?? log.action}
                </span>
              </div>
            ))}
          </div>
        )
      ) : recentTasks.length === 0 ? (
        <p className={`text-sm ${textSecondary} py-8 text-center`}>{DASHBOARD_PAGE_CONSTANTS.taskEmptyMessage}</p>
      ) : (
        <div className="space-y-1">
          {recentTasks.map((task, index) => {
            const statusStyle = statusStyles[task.status]
            return (
              <div
                key={task.id}
                className={`flex items-center gap-4 py-3 border-b ${dividerColor} last:border-0 stagger-card cursor-pointer ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                style={{ animationDelay: `${index * 45}ms` }}
                role="button"
                tabIndex={0}
                onClick={() => onOpenProjectBoard(task.projectId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onOpenProjectBoard(task.projectId)
                  }
                }}
              >
                <div className={`w-2 h-2 rounded-full ${statusStyle.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium truncate ${textPrimary}`}>{task.name}</div>
                  <div className={`text-xs ${textSecondary}`}>
                    {task.projectName} · {formatRecentTaskAssigneesShort(task)} ·{' '}
                    {new Date(task.deadline).toLocaleDateString()}
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle.color} ${statusStyle.bg} shrink-0`}>
                  {TASK_STATUS_LABELS[task.status]}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </PageSection>
  )
}
