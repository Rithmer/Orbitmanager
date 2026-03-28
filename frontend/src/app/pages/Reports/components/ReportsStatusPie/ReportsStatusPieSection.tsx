import { useCallback, useState } from 'react'
import { Cell, Label, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PageSection, RefreshBadge } from '@/app/components/PageShell'
import type { ReportsStatusDistributionItem } from '@/app/features/reports'
import { REPORTS_PAGE_CONSTANTS } from '@/app/pages/Reports/constants'
import { NeonStatusPieSlice } from './ReportsStatusPieNeonSlice'
import { StatusPieCenterTotalLabel, StatusPiePercentLabel } from './ReportsStatusPieSvgLabels'
import { percentOfTotal } from '@/app/pages/Reports/helpers'
import type { ReportsStatusPieSectionProps, StatusPieSliceProps } from '@/app/pages/Reports/types'

const C = REPORTS_PAGE_CONSTANTS

export function ReportsStatusPieSection({
  tokens,
  isDark,
  statusDistribution,
  statusTotal,
  isRefreshing = false,
}: ReportsStatusPieSectionProps) {
  const axisColor = tokens.axisColor
  const muted = isDark ? '#94a3b8' : '#737373'
  const centerLabelFill = isDark ? '#e0f2fe' : '#202224'
  const centerSubFill = isDark ? '#7dd3fc' : axisColor

  const [hovered, setHovered] = useState<ReportsStatusDistributionItem | null>(null)

  const renderNeonSlice = useCallback(
    (p: StatusPieSliceProps) => <NeonStatusPieSlice {...p} hoveredData={hovered} isDark={isDark} />,
    [hovered, isDark],
  )

  const pieCaptionStyle = { color: muted, fontSize: 12, fontWeight: 500 as const }
  const pieValueStyle = { color: muted, fontSize: 12 }
  const tooltipSurface = {
    ...tokens.tooltipStyle,
    color: muted,
    boxShadow: isDark ? '0 0 16px rgba(34,211,238,0.12)' : undefined,
    borderColor: isDark ? 'rgba(34,211,238,0.35)' : tokens.tooltipStyle.border,
  }

  return (
    <PageSection
      title="Статус задач"
      description="Распределение задач по текущему состоянию."
      className={`card-hover xl:col-span-1 ${tokens.cardBg} border ${tokens.cardBorder} stagger-row`.trim()}
      headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
    >
      <div
        className="[&_li.recharts-legend-item]:cursor-pointer"
        style={{ height: C.STATUS_PIE_HEIGHT }}
        onMouseLeave={() => setHovered(null)}
      >
        {statusDistribution.length === 0 ? (
          <p className={`text-sm ${tokens.textSecondary} text-center py-10`}>{C.EMPTY_TEXT}</p>
        ) : (
          <ResponsiveContainer width="100%" height={C.STATUS_PIE_HEIGHT}>
            <PieChart margin={{ ...C.STATUS_PIE_MARGIN }}>
              <Pie
                data={statusDistribution}
                nameKey="label"
                cx={C.STATUS_PIE_CX}
                cy={C.STATUS_PIE_CY}
                innerRadius={C.STATUS_PIE_INNER_RADIUS}
                outerRadius={C.STATUS_PIE_OUTER_RADIUS}
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
                  if (row) setHovered(row)
                }}
                labelLine={false}
                isAnimationActive={false}
                label={(props) => <StatusPiePercentLabel {...props} isDark={isDark} />}
              >
                <Label
                  content={({ viewBox }) => (
                    <StatusPieCenterTotalLabel
                      viewBox={viewBox}
                      isDark={isDark}
                      statusTotal={statusTotal}
                      centerSubFill={centerSubFill}
                      centerLabelFill={centerLabelFill}
                    />
                  )}
                />
                {statusDistribution.map((entry) => (
                  <Cell key={entry.label} fill={entry.color} stroke={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipSurface}
                labelStyle={pieCaptionStyle}
                itemStyle={pieValueStyle}
                formatter={(value: number, _name, item) => {
                  const label = (item?.payload as { label?: string } | undefined)?.label ?? ''
                  return [`${value} шт. (${percentOfTotal(value, statusTotal)}%)`, label]
                }}
              />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={10}
                wrapperStyle={{ paddingTop: 8, color: muted }}
                onMouseEnter={(_entry, index) => {
                  const row = statusDistribution[index]
                  if (row) setHovered(row)
                }}
                formatter={(value, entry) => {
                  const v = (entry as { payload?: { value?: number } }).payload?.value
                  const n = typeof v === 'number' ? v : 0
                  return (
                    <span
                      style={{
                        color: muted,
                        fontSize: 12,
                        textShadow: isDark ? '0 0 8px rgba(34,211,238,0.23)' : undefined,
                      }}
                    >
                      {value}: {n} ({percentOfTotal(n, statusTotal)}%)
                    </span>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </PageSection>
  )
}
