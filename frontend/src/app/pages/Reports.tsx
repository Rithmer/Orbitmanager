import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { AlertCircle, CheckCircle2, Clock, TrendingUp, RefreshCw } from 'lucide-react'
import { useTheme } from '../context/useTheme'
import {
  AnalyticsChartSkeleton,
  PageRefreshOverlay,
  PageSection,
  PageShell,
  PageToolbarSkeleton,
  RefreshBadge,
  StatCardsSkeleton,
} from '../components/PageShell'
import { useSmoothPageSkeleton } from '../hooks/useSmoothPageSkeleton'
import { useReportsSummaryQuery } from '../features/reports'

export function Reports() {
  const { isDark } = useTheme()
  const summaryQuery = useReportsSummaryQuery()
  const summary = summaryQuery.data
  const isInitialLoading = summaryQuery.isPending && !summary
  const isRefreshing = summaryQuery.isFetching && !!summary
  const errorMessage =
    summaryQuery.error instanceof Error
      ? summaryQuery.error.message
      : 'Не удалось загрузить данные аналитики. Попробуйте обновить страницу.'

  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const gridColor = isDark ? '#313d4f' : '#f0f0f0'
  const axisColor = isDark ? '#94a3b8' : '#9ca3af'

  const overview = summary?.overview
  const statusDistribution = summary?.statusDistribution ?? []
  const projectTaskBreakdown = summary?.projectTaskBreakdown ?? []
  const difficultyDistribution = summary?.difficultyDistribution ?? []

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
      iconBg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      iconColor: 'text-amber-500',
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
      label: 'Эффективность',
      value: `${overview?.efficiency ?? 0}%`,
      change: `${overview?.projectCount ?? 0} проектов`,
      icon: TrendingUp,
      iconBg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      iconColor: 'text-[#4880ff]',
    },
  ]

  const tooltipStyle = {
    backgroundColor: isDark ? '#273142' : '#fff',
    border: `1px solid ${isDark ? '#313d4f' : '#e8e8e8'}`,
    borderRadius: '8px',
    color: isDark ? '#f4f3f2' : '#202224',
    fontSize: '12px',
  }

  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoading)

  if (showInitialSkeleton) {
    return (
      <PageShell title="Аналитика" description="Подготавливаем сводку эффективности и распределений.">
        <div className="space-y-6">
          <PageToolbarSkeleton />
          <StatCardsSkeleton count={4} />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <AnalyticsChartSkeleton className="xl:col-span-2" heightClassName="h-[240px]" />
            <AnalyticsChartSkeleton heightClassName="h-[240px]" />
          </div>
          <AnalyticsChartSkeleton heightClassName="h-[200px]" />
        </div>
      </PageShell>
    )
  }

  if (!summary && summaryQuery.error) {
    return (
      <PageShell
        title="Аналитика"
        description="Не удалось загрузить данные аналитики."
        actions={
          <button
            onClick={() => void summaryQuery.refetch()}
            className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
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

  return (
    <PageShell
      title="Аналитика"
      description={isRefreshing ? 'Сводка обновляется в фоне.' : 'Обзор производительности и прогресса.'}
      actions={
        <div className="flex items-center gap-3">
          {isRefreshing ? <RefreshBadge isRefreshing label="Обновляем отчёты" /> : null}
          <button
            onClick={() => void summaryQuery.refetch()}
            disabled={isRefreshing}
            aria-busy={isRefreshing}
            className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRefreshing ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isRefreshing ? 'Обновление...' : 'Обновить'}
          </button>
        </div>
      }
    >
      {summaryQuery.error && summary ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          Не удалось обновить данные. Показаны сохранённые значения.
        </div>
      ) : null}

      <PageRefreshOverlay show={isRefreshing} label="Обновляем метрики" className="mb-6 md:mb-8">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5 page-load-stagger">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`${cardBg} border ${cardBorder} rounded-xl p-5 card-hover stagger-row`}
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
              <div className={`mt-3 text-xs ${textSecondary}`}>{stat.change}</div>
            </div>
          ))}
        </div>
      </PageRefreshOverlay>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <PageSection
          title="Задачи по проектам"
          description="Количество задач и завершённых задач в наиболее активных проектах."
          className={`card-hover xl:col-span-2 ${cardBg} border ${cardBorder} stagger-row`.trim()}
          // Лёгкое запаздывание среднего ряда относительно верхних карточек
          // @ts-expect-error inline style on section root
          style={{ animationDelay: '180ms' }}
          isRefreshing={isRefreshing}
          refreshLabel="Обновляем график по проектам"
          headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
        >
          <div style={{ height: 240 }}>
            {projectTaskBreakdown.length === 0 ? (
              <p className={`text-sm ${textSecondary} text-center py-10`}>Нет данных для отображения</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={projectTaskBreakdown} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="projectName" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    cursor={{ fill: isDark ? 'rgba(72,128,255,0.05)' : 'rgba(72,128,255,0.04)' }}
                  />
                  <Bar
                    dataKey="taskCount"
                    fill={isDark ? '#4880ff' : '#93c5fd'}
                    name="Всего"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive
                    animationBegin={0}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="completedTaskCount"
                    fill="#4880ff"
                    name="Выполнено"
                    radius={[4, 4, 0, 0]}
                    isAnimationActive
                    animationBegin={160}
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </PageSection>

        <PageSection
          title="Статус задач"
          description="Распределение задач по текущему состоянию."
          className={`card-hover ${cardBg} border ${cardBorder} stagger-row`.trim()}
          // Вторая секция средней полосы — ещё чуть позже
          // @ts-expect-error inline style on section root
          style={{ animationDelay: '260ms' }}
          isRefreshing={isRefreshing}
          refreshLabel="Обновляем распределение статусов"
          headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
        >
          <div style={{ height: 240 }}>
            {statusDistribution.length === 0 ? (
              <p className={`text-sm ${textSecondary} text-center py-10`}>Нет данных</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive
                    animationBegin={0}
                    animationDuration={900}
                    animationEasing="ease-out"
                  >
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => <span style={{ color: axisColor, fontSize: 12 }}>{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </PageSection>
      </div>

      <PageSection
        title="Распределение по сложности"
        description="Группировка задач по уровням сложности."
        className={`card-hover ${cardBg} border ${cardBorder} stagger-row`.trim()}
        // Нижний блок появляется после верхних и средних
        // @ts-expect-error inline style on section root
        style={{ animationDelay: '380ms' }}
        isRefreshing={isRefreshing}
        refreshLabel="Обновляем распределение по сложности"
        headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
      >
        <div style={{ height: 200 }}>
          {difficultyDistribution.length === 0 ? (
            <p className={`text-sm ${textSecondary} text-center py-10`}>Нет данных</p>
          ) : (
            <div className="chart-draw-ltr">
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={difficultyDistribution}>
                  <defs>
                    <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4880ff" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#4880ff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#4880ff"
                    strokeWidth={2.5}
                    fill="url(#prodGradient)"
                    name="Количество задач"
                    dot={{ fill: '#4880ff', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#4880ff' }}
                    isAnimationActive
                    animationBegin={0}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </PageSection>
    </PageShell>
  )
}
