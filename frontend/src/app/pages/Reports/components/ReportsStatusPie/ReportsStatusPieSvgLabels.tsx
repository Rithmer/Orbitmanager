import type { ReactNode } from 'react'
import { REPORTS_PAGE_CONSTANTS } from '@/app/pages/Reports/constants'
import { RADIAN } from '@/app/pages/Reports/helpers'
import type { StatusPieCenterTotalLabelProps, StatusPiePercentLabelProps } from '@/app/pages/Reports/types'

export function StatusPiePercentLabel({ isDark, ...props }: StatusPiePercentLabelProps): ReactNode {
  const cx = Number(props.cx)
  const cy = Number(props.cy)
  const midAngle = props.midAngle ?? 0
  const ir = Number(props.innerRadius)
  const or = Number(props.outerRadius)
  const percent = typeof props.percent === 'number' ? props.percent : 0
  if (percent < REPORTS_PAGE_CONSTANTS.STATUS_PIE_MIN_PERCENT_LABEL) return null

  const t = REPORTS_PAGE_CONSTANTS.STATUS_PIE_LABEL_RING_T
  const radius = ir + (or - ir) * t
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
}

function pieCenterCoords(viewBox: unknown): { cx: number; cy: number } | null {
  if (viewBox == null || typeof viewBox !== 'object') return null
  const { cx, cy } = viewBox as { cx?: string | number; cy?: string | number }
  if (cx == null || cy == null) return null
  return { cx: Number(cx), cy: Number(cy) }
}

export function StatusPieCenterTotalLabel({
  viewBox,
  isDark,
  statusTotal,
  centerSubFill,
  centerLabelFill,
}: StatusPieCenterTotalLabelProps) {
  const coords = pieCenterCoords(viewBox)
  if (coords == null) return null
  const { cx, cy } = coords
  const darkTs = (filter: string) => ({ filter } as const)

  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" pointerEvents="none">
      <tspan
        x={cx}
        dy="-0.35em"
        fill={centerSubFill}
        fontSize={11}
        fontWeight={500}
        style={isDark ? darkTs('drop-shadow(0 0 5px rgba(34,211,238,0.34))') : undefined}
      >
        Всего задач
      </tspan>
      <tspan
        x={cx}
        dy="1.25em"
        fill={centerLabelFill}
        fontSize={22}
        fontWeight={700}
        style={isDark ? darkTs('drop-shadow(0 0 7px rgba(165,243,252,0.27))') : undefined}
      >
        {statusTotal}
      </tspan>
    </text>
  )
}
