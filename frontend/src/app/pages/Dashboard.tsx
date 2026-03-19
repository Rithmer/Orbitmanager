import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, Plus, TrendingUp } from 'lucide-react'
import {
  PageRefreshOverlay,
  PageSection,
  PageShell,
  RefreshBadge,
  StatCardsSkeleton,
} from '../components/PageShell'
import { useSmoothPageSkeleton } from '../hooks/useSmoothPageSkeleton'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'
import { TaskStatus, TASK_STATUS_LABELS } from '../types'
import { useDashboardSummaryQuery } from '../features/dashboard'

function DashboardListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`dashboard-task-skeleton-${index}`}
          className="flex items-center gap-4 rounded-xl border border-black/5 bg-black/5 px-4 py-3 dark:border-white/5 dark:bg-white/5"
        >
          <div className="h-2.5 w-2.5 rounded-full skeleton-shimmer bg-black/10 dark:bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded-lg skeleton-shimmer bg-black/10 dark:bg-white/10" />
            <div className="h-3 w-1/2 rounded-lg skeleton-shimmer bg-black/10 dark:bg-white/10" />
          </div>
          <div className="h-6 w-20 rounded-full skeleton-shimmer bg-black/10 dark:bg-white/10" />
        </div>
      ))}
    </div>
  )
}

function DashboardInsightSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`dashboard-insight-skeleton-${index}`}
          className="rounded-xl border border-black/5 bg-black/5 p-4 dark:border-white/5 dark:bg-white/5"
        >
          <div className="space-y-2">
            <div className="h-4 w-4/5 rounded-lg skeleton-shimmer bg-black/10 dark:bg-white/10" />
            <div className="h-3 w-2/3 rounded-lg skeleton-shimmer bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function Dashboard() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const summaryQuery = useDashboardSummaryQuery()

  const summary = summaryQuery.data
  const isInitialLoading = summaryQuery.isPending && !summary
  const isRefreshing = summaryQuery.isFetching && !!summary
  const errorMessage =
    summaryQuery.error instanceof Error
      ? summaryQuery.error.message
      : 'Не удалось загрузить данные. Попробуйте обновить страницу.'

  const firstName = user?.fullName?.split(' ')[0] || 'Пользователь'

  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const dividerColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'

  const statusStyles = useMemo<Record<TaskStatus, { color: string; bg: string; dot: string }>>(
    () => ({
      [TaskStatus.NEW]: {
        color: 'text-[#4880ff]',
        bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
        dot: 'bg-[#4880ff]',
      },
      [TaskStatus.IN_PROGRESS]: {
        color: 'text-orange-500',
        bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
        dot: 'bg-orange-500',
      },
      [TaskStatus.REVIEW]: {
        color: 'text-purple-500',
        bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
        dot: 'bg-purple-500',
      },
      [TaskStatus.DONE]: {
        color: 'text-emerald-500',
        bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
        dot: 'bg-emerald-500',
      },
      [TaskStatus.CANCELLED]: {
        color: 'text-red-500',
        bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
        dot: 'bg-red-500',
      },
    }),
    [isDark],
  )

  const insightStyles = {
    error: {
      bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      border: isDark ? 'border-red-500/30' : 'border-red-200',
      text: isDark ? 'text-red-400' : 'text-red-700',
      dot: 'bg-red-500',
    },
    warning: {
      bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      border: isDark ? 'border-orange-500/30' : 'border-orange-200',
      text: isDark ? 'text-orange-400' : 'text-orange-700',
      dot: 'bg-orange-500',
    },
    info: {
      bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      border: isDark ? 'border-[#4880ff]/30' : 'border-blue-200',
      text: isDark ? 'text-[#7aa5ff]' : 'text-blue-700',
      dot: 'bg-[#4880ff]',
    },
  } as const

  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoading)

  if (showInitialSkeleton) {
    return (
      <PageShell
        title={`Добро пожаловать, ${firstName}!`}
        description="Подготавливаем сводку по задачам, проектам и рискам."
      >
        <div className="space-y-6">
          <StatCardsSkeleton count={4} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <div className={`xl:col-span-2 rounded-xl border ${cardBorder} ${cardBg} p-6 shadow-sm`}>
              <div className="mb-4 space-y-2">
                <div className="h-5 w-40 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
                <div className="h-4 w-72 max-w-full rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
              </div>
              <DashboardListSkeleton />
            </div>
            <div className={`rounded-xl border ${cardBorder} ${cardBg} p-6 shadow-sm`}>
              <div className="mb-4 space-y-2">
                <div className="h-5 w-36 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
                <div className="h-4 w-56 max-w-full rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
              </div>
              <DashboardInsightSkeleton />
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  if (!summary && summaryQuery.error) {
    return (
      <PageShell
        title={`Добро пожаловать, ${firstName}!`}
        description="Не удалось загрузить сводку."
        actions={
          <button
            onClick={() => void summaryQuery.refetch()}
            className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Повторить
          </button>
        }
      >
        <PageSection title="Ошибка загрузки">
          <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className={`text-sm ${textSecondary} max-w-md`}>{errorMessage}</p>
          </div>
        </PageSection>
      </PageShell>
    )
  }

  const overview = summary?.overview
  const recentTasks = summary?.recentTasks ?? []
  const riskInsights = summary?.riskInsights ?? []

  const stats = [
    {
      label: 'Выполнено',
      value: String(overview?.doneTasks ?? 0),
      change: `из ${overview?.totalTasks ?? 0} задач`,
      icon: CheckCircle2,
      iconBg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'В процессе',
      value: String(overview?.inProgressTasks ?? 0),
      change: 'активных задач',
      icon: Clock,
      iconBg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Просрочено',
      value: String(overview?.overdueTasks ?? 0),
      change: (overview?.overdueTasks ?? 0) > 0 ? 'требует внимания' : 'все в порядке',
      icon: AlertCircle,
      iconBg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      label: 'Прогресс',
      value: `${overview?.progressPercent ?? 0}%`,
      change: `${overview?.projectCount ?? 0} проектов`,
      icon: TrendingUp,
      iconBg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      iconColor: 'text-[#4880ff]',
    },
  ]

  return (
    <PageShell
      title={`Добро пожаловать, ${firstName}!`}
      description={
        isRefreshing
          ? 'Сводка обновляется в фоне.'
          : `У вас ${overview?.inProgressTasks ?? 0} активных задач.`
      }
      actions={
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {isRefreshing ? <RefreshBadge isRefreshing label="Сводка обновляется" /> : null}
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 btn-fizzy"
          >
            <Plus className="w-4 h-4" />
            Создать проект
          </button>
        </div>
      }
    >
      {summaryQuery.error && summary ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Не удалось обновить данные. Показаны сохранённые значения.
        </div>
      ) : null}

      <PageRefreshOverlay show={isRefreshing} label="Сводка обновляется" className="mb-6 md:mb-8">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5 stagger-row">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`${cardBg} border ${cardBorder} rounded-xl p-5 card-hover stagger-card`}
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</div>
                  <div className={`text-sm ${textSecondary}`}>{stat.label}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className={`text-xs ${textSecondary}`}>{stat.change}</span>
              </div>
            </div>
          ))}
        </div>
      </PageRefreshOverlay>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <PageSection
          title="Последние задачи"
          description="Показаны самые свежие задачи из доступных проектов."
          className={`card-hover xl:col-span-2 ${cardBg} border ${cardBorder} fade-in-up`.trim()}
          isRefreshing={isRefreshing}
          refreshLabel="Обновляем последние задачи"
          headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
        >
          {recentTasks.length === 0 ? (
            <p className={`text-sm ${textSecondary} py-8 text-center`}>
              Задач пока нет. Создайте проект и добавьте задачи.
            </p>
          ) : (
            <div className="space-y-1">
              {recentTasks.map((task, index) => {
                const statusStyle = statusStyles[task.status]

                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 py-3 border-b ${dividerColor} last:border-0 stagger-card`}
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <div className={`w-2 h-2 rounded-full ${statusStyle.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${textPrimary}`}>{task.name}</div>
                      <div className={`text-xs ${textSecondary}`}>
                        {task.projectName} · {task.assigneeName ?? 'Без исполнителя'} ·{' '}
                        {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle.color} ${statusStyle.bg} shrink-0`}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </PageSection>

        <PageSection
          title="AI аналитика рисков"
          description="Оценка задач с наибольшей вероятностью задержки."
          className={`card-hover ${cardBg} border ${cardBorder} fade-in-up`.trim()}
          isRefreshing={isRefreshing}
          refreshLabel="Обновляем аналитику рисков"
          headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
        >
          {riskInsights.length === 0 ? (
            <p className={`text-sm ${textSecondary} py-8 text-center`}>
              Данные о рисках появятся после создания задач с дедлайнами.
            </p>
          ) : (
            <div className="space-y-3">
              {riskInsights.map((insight, index) => {
                const style = insightStyles[insight.type]

                return (
                  <div
                    key={insight.taskId}
                    className={`${style.bg} border ${style.border} rounded-lg p-3.5 stagger-card`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1.5 shrink-0`} />
                      <p className={`text-sm leading-relaxed ${style.text}`}>{insight.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </PageSection>
      </div>
    </PageShell>
  )
}
