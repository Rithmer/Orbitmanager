import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Label,
  Sector,
  AreaChart,
  Area,
} from 'recharts'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { useTheme } from '../context/useTheme'
import {
  AnalyticsChartSkeleton,
  PageRefreshOverlay,
  PageSection,
  PageShell,
  PageToolbarSkeleton,
  RefreshBadge,
} from '../components/PageShell'
import { useSmoothPageSkeleton } from '../hooks/useSmoothPageSkeleton'
import { useAnalyticsSectionAccess } from '../hooks/useAnalyticsSectionAccess'
import { useAuth } from '../context/useAuth'
import {
  type ReportsStatusDistributionItem,
  useReportsProjectsQuery,
  useReportsSummaryQuery,
} from '../features/reports'

function sameStatusRow(
  a: ReportsStatusDistributionItem | null | undefined,
  b: ReportsStatusDistributionItem | null | undefined,
): boolean {
  if (!a || !b) return false
  if (a === b) return true
  return a.label === b.label && a.value === b.value
}

type PieSliceProps = {
  cx?: number
  cy?: number
  innerRadius?: number
  outerRadius?: number
  startAngle?: number
  endAngle?: number
  midAngle?: number
  fill?: string
  stroke?: string
  payload?: ReportsStatusDistributionItem
}

const NEON_DIM = 0.82 * 0.9

function NeonStatusPieSlice(
  props: PieSliceProps & {
    hoveredData: PieSliceProps['payload'] | null
    isDark: boolean
  },
) {
  const {
    cx = 0,
    cy = 0,
    innerRadius = 0,
    outerRadius = 0,
    startAngle = 0,
    endAngle = 0,
    midAngle,
    fill = '#8884d8',
    stroke,
    payload,
    hoveredData,
    isDark,
  } = props

  const isHoveredSlice = sameStatusRow(payload, hoveredData)
  const RADIAN = Math.PI / 180
  const ma = Number(midAngle ?? (startAngle + endAngle) / 2)
  const cos = Math.cos(-RADIAN * ma)
  const sin = Math.sin(-RADIAN * ma)
  const pullPx = isHoveredSlice ? 9 : 0
  const tx = pullPx * cos
  const ty = pullPx * sin
  const scale = isHoveredSlice ? 1.07 : 1

  const d = NEON_DIM
  const idleNeon = isDark
    ? `drop-shadow(0 0 ${4 * d}px color-mix(in srgb, ${fill} 42%, transparent)) drop-shadow(0 0 ${8 * d}px ${fill}) drop-shadow(0 0 ${14 * d}px ${fill}88) brightness(${1 + 0.1 * d})`
    : `drop-shadow(0 0 ${3 * d}px ${fill}66) drop-shadow(0 0 ${8 * d}px ${fill}44) brightness(${1 + 0.04 * d})`
  const hoverNeonBoost = isHoveredSlice
    ? ` drop-shadow(0 0 ${9 * d}px ${fill}) drop-shadow(0 0 ${16 * d}px ${fill}99) brightness(${1 + 0.06 * d})`
    : ''
  const strokeW = isHoveredSlice ? 1.35 : 0
  const strokeCol = strokeW > 0 ? (isDark ? fill : stroke ?? fill) : fill

  const gTransform = `translate(${tx}px, ${ty}px) translate(${cx}px, ${cy}px) scale(${scale}) translate(${-cx}px, ${-cy}px)`

  return (
    <g
      style={{
        transform: gTransform,
        transition: 'transform 0.42s cubic-bezier(0.2, 0.95, 0.25, 1)',
      }}
    >
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke={strokeCol}
        strokeWidth={strokeW}
        style={{ filter: `${idleNeon}${hoverNeonBoost}`.trim() }}
      />
    </g>
  )
}

export function Reports() {
  const { isDark } = useTheme()
  const { isAdmin } = useAuth()
  const { allowed: canUseReports, isLoading: reportsAccessLoading } = useAnalyticsSectionAccess()
  const reportsApiEnabled = isAdmin || (!reportsAccessLoading && canUseReports)

  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined)
  const projectsQuery = useReportsProjectsQuery({ enabled: reportsApiEnabled })

  const projects = useMemo(
    () =>
      [...(projectsQuery.data ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name, 'ru'),
      ),
    [projectsQuery.data],
  )

  useEffect(() => {
    if (projects.length === 0) {
      if (selectedProjectId !== undefined) setSelectedProjectId(undefined)
      return
    }

    const hasSelectedProject = selectedProjectId !== undefined
      && projects.some((project) => project.id === selectedProjectId)

    if (!hasSelectedProject) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const summaryProjectId = selectedProjectId

  const summaryQuery = useReportsSummaryQuery(summaryProjectId, {
    enabled: reportsApiEnabled && summaryProjectId !== undefined,
  })
  const summary = summaryQuery.data
  const waitingForReportsAccess = !isAdmin && reportsAccessLoading
  const isInitialLoading =
    reportsApiEnabled && summaryQuery.isPending && !summary
  const isRefreshing = reportsApiEnabled && summaryQuery.isFetching && !!summary
  const errorMessage =
    summaryQuery.error instanceof Error
      ? summaryQuery.error.message
      : 'Не удалось загрузить данные аналитики. Попробуйте обновить страницу.'

  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const gridColor = isDark ? '#313d4f' : '#f0f0f0'
  const axisColor = isDark ? '#94a3b8' : '#9ca3af'

  const statusDistribution = useMemo(
    () => summary?.statusDistribution ?? [],
    [summary?.statusDistribution],
  )
  const projectTaskBreakdown = summary?.projectTaskBreakdown ?? []
  const difficultyDistribution = summary?.difficultyDistribution ?? []

  const statusTotal = useMemo(
    () => statusDistribution.reduce((sum, item) => sum + item.value, 0),
    [statusDistribution],
  )

  const centerLabelFill = isDark ? '#e0f2fe' : '#202224'
  const centerSubFill = isDark ? '#7dd3fc' : axisColor

  const [statusPieHovered, setStatusPieHovered] = useState<ReportsStatusDistributionItem | null>(null)

  const renderNeonSlice = useCallback(
    (p: PieSliceProps) => <NeonStatusPieSlice {...p} hoveredData={statusPieHovered} isDark={isDark} />,
    [statusPieHovered, isDark],
  )

  const tooltipStyle = {
    backgroundColor: isDark ? '#273142' : '#fff',
    border: `1px solid ${isDark ? '#313d4f' : '#e8e8e8'}`,
    borderRadius: '8px',
    color: isDark ? '#f4f3f2' : '#202224',
    fontSize: '12px',
  }

  const statusCardDescriptionColor = isDark ? '#94a3b8' : '#737373'
  const pieTooltipLabelStyle = {
    color: statusCardDescriptionColor,
    fontSize: 12,
    fontWeight: 500,
  }
  const pieTooltipItemStyle = { color: statusCardDescriptionColor, fontSize: 12 }

  const showInitialSkeleton = useSmoothPageSkeleton(waitingForReportsAccess || isInitialLoading)

  if (showInitialSkeleton) {
    return (
      <PageShell title="Аналитика" description="Подготавливаем сводку эффективности и распределений.">
        <div className="space-y-6">
          <PageToolbarSkeleton />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <AnalyticsChartSkeleton className="xl:col-span-2" heightClassName="h-[240px]" />
            <AnalyticsChartSkeleton heightClassName="h-[280px]" />
          </div>
          <AnalyticsChartSkeleton heightClassName="h-[200px]" />
        </div>
      </PageShell>
    )
  }

  if (!isAdmin && !reportsAccessLoading && !canUseReports) {
    return (
      <PageShell
        title="Аналитика"
        description="Раздел доступен администраторам, владельцам команд, тимлидам и наблюдателям прикреплённых проектов."
      >
        <PageSection title="Нет доступа">
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <p className={`text-sm ${textSecondary} max-w-md`}>
              Аналитика недоступна для роли «Разработчик» в проекте. Назначьте тимлида или наблюдателя, либо обратитесь к владельцу команды или администратору.
            </p>
          </div>
        </PageSection>
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
      description={
        isRefreshing
          ? 'Сводка обновляется в фоне.'
          : 'В одной строке — активность по проектам и распределение по статусам; ниже — сложность задач.'
      }
      actions={
        <div className="flex items-center gap-3 flex-wrap">
          {projectsQuery.isPending ? (
            <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${textSecondary} bg-transparent border border-transparent`}>
              Загрузка проектов...
            </div>
          ) : projects.length > 0 ? (
            <select
              value={selectedProjectId !== undefined ? String(selectedProjectId) : ''}
              onChange={(e) => {
                const next = e.target.value ? Number(e.target.value) : undefined
                setSelectedProjectId(next)
              }}
              className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : null}
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

      <PageRefreshOverlay show={isRefreshing} label="Обновляем данные" className="mb-4 md:mb-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <PageSection
            title="Задачи по проектам"
            description="Количество задач и завершённых задач в наиболее активных проектах."
            className={`card-hover xl:col-span-2 ${cardBg} border ${cardBorder} stagger-row`.trim()}
            // @ts-expect-error inline style on section root
            style={{ animationDelay: '120ms' }}
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
            className={`card-hover xl:col-span-1 ${cardBg} border ${cardBorder} stagger-row`.trim()}
            // @ts-expect-error inline style on section root
            style={{ animationDelay: '200ms' }}
            isRefreshing={isRefreshing}
            refreshLabel="Обновляем распределение статусов"
            headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
          >
            <div
              className="[&_li.recharts-legend-item]:cursor-pointer"
              style={{ height: 280 }}
              onMouseLeave={() => setStatusPieHovered(null)}
            >
              {statusDistribution.length === 0 ? (
                <p className={`text-sm ${textSecondary} text-center py-10`}>Нет данных</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart margin={{ top: 10, right: 8, left: 8, bottom: 8 }}>
                    <Pie
                      data={statusDistribution}
                      nameKey="label"
                      cx="50%"
                      cy="48%"
                      innerRadius={52}
                      outerRadius={86}
                      paddingAngle={0}
                      dataKey="value"
                      blendStroke
                      stroke="transparent"
                      strokeWidth={0}
                      cursor="pointer"
                      activeIndex={-1}
                      inactiveShape={renderNeonSlice}
                      onMouseEnter={(sector, i) => {
                        const row = sector?.payload ?? statusDistribution[i]
                        if (row) setStatusPieHovered(row)
                      }}
                      labelLine={false}
                      isAnimationActive={false}
                    label={(props) => {
                      const cx = Number(props.cx)
                      const cy = Number(props.cy)
                      const midAngle = props.midAngle ?? 0
                      const ir = Number(props.innerRadius)
                      const or = Number(props.outerRadius)
                      const percent = typeof props.percent === 'number' ? props.percent : 0
                      if (percent < 0.07) return null
                      const RADIAN = Math.PI / 180
                      const radius = ir + (or - ir) * 0.58
                      const x = cx + radius * Math.cos(-midAngle * RADIAN)
                      const y = cy + radius * Math.sin(-midAngle * RADIAN)
                      return (
                        <text
                          x={x}
                          y={y}
                          fill={isDark ? '#ecfeff' : '#0f172a'}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={12}
                          fontWeight={700}
                          pointerEvents="none"
                          style={{
                            paintOrder: 'stroke fill',
                            stroke: isDark ? 'rgba(15,23,42,0.75)' : 'rgba(255,255,255,0.9)',
                            strokeWidth: 3,
                            strokeLinejoin: 'round',
                            filter: isDark ? 'drop-shadow(0 0 4px rgba(34,211,238,0.32))' : undefined,
                          }}
                        >
                          {`${Math.round(percent * 100)}%`}
                        </text>
                      )
                    }}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox == null) return null
                        const vb = viewBox as { cx?: string | number; cy?: string | number }
                        if (vb.cx == null || vb.cy == null) return null
                        const cx = Number(vb.cx)
                        const cy = Number(vb.cy)
                        return (
                          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" pointerEvents="none">
                            <tspan
                              x={cx}
                              dy="-0.35em"
                              fill={centerSubFill}
                              fontSize={11}
                              fontWeight={500}
                              style={
                                isDark
                                  ? { filter: 'drop-shadow(0 0 5px rgba(34,211,238,0.34))' }
                                  : undefined
                              }
                            >
                              Всего задач
                            </tspan>
                            <tspan
                              x={cx}
                              dy="1.25em"
                              fill={centerLabelFill}
                              fontSize={22}
                              fontWeight={700}
                              style={
                                isDark
                                  ? { filter: 'drop-shadow(0 0 7px rgba(165,243,252,0.27))' }
                                  : undefined
                              }
                            >
                              {statusTotal}
                            </tspan>
                          </text>
                        )
                      }}
                    />
                    {statusDistribution.map((entry) => (
                      <Cell key={entry.label} fill={entry.color} stroke={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      ...tooltipStyle,
                      color: statusCardDescriptionColor,
                      boxShadow: isDark ? '0 0 16px rgba(34,211,238,0.12)' : undefined,
                      borderColor: isDark ? 'rgba(34,211,238,0.35)' : tooltipStyle.border,
                    }}
                    labelStyle={pieTooltipLabelStyle}
                    itemStyle={pieTooltipItemStyle}
                    formatter={(value: number, _name, item) => {
                      const payload = item?.payload as { label?: string } | undefined
                      const label = payload?.label ?? ''
                      const pct = statusTotal > 0 ? Math.round((value / statusTotal) * 100) : 0
                      return [`${value} шт. (${pct}%)`, label]
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={10}
                    wrapperStyle={{ paddingTop: 8, color: statusCardDescriptionColor }}
                    onMouseEnter={(_entry, index) => {
                      const row = statusDistribution[index]
                      if (row) setStatusPieHovered(row)
                    }}
                    formatter={(value, entry) => {
                      const payload = (entry as { payload?: { value?: number } }).payload
                      const v = typeof payload?.value === 'number' ? payload.value : 0
                      const p = statusTotal > 0 ? Math.round((v / statusTotal) * 100) : 0
                      return (
                        <span
                          style={{
                            color: statusCardDescriptionColor,
                            fontSize: 12,
                            textShadow: isDark ? '0 0 8px rgba(34,211,238,0.23)' : undefined,
                          }}
                        >
                          {value}: {v} ({p}%)
                        </span>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </PageSection>
        </div>
      </PageRefreshOverlay>

      <PageSection
        title="Распределение по сложности"
        description="Группировка задач по уровням сложности."
        className={`card-hover ${cardBg} border ${cardBorder} stagger-row`.trim()}
        // @ts-expect-error inline style on section root
        style={{ animationDelay: '380ms' }}
        isRefreshing={isRefreshing}
        refreshLabel="Обновляем распределение по сложности"
        headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
      >
        <div style={{ height: 228 }} className="px-2 pt-2">
          {difficultyDistribution.length === 0 ? (
            <p className={`text-sm ${textSecondary} text-center py-10`}>Нет данных</p>
          ) : (
            <div className="chart-draw-ltr">
              <ResponsiveContainer width="100%" height={212}>
                <AreaChart
                  data={difficultyDistribution}
                  margin={{ top: 18, right: 16, left: 6, bottom: 10 }}
                >
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
                    dot={{ fill: '#4880ff', strokeWidth: 0, r: 4, stroke: 'none' }}
                    activeDot={{
                      r: 6,
                      fill: '#4880ff',
                      stroke: isDark ? '#273142' : '#ffffff',
                      strokeWidth: 2,
                    }}
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
