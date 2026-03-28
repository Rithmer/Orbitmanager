import { Sector } from 'recharts'
import { REPORTS_PAGE_CONSTANTS } from '@/app/pages/Reports/constants'
import { RADIAN, sameStatusRow } from '@/app/pages/Reports/helpers'
import type { NeonStatusPieSliceProps } from '@/app/pages/Reports/types'

export function NeonStatusPieSlice({
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
}: NeonStatusPieSliceProps) {
  const hovered = sameStatusRow(payload, hoveredData)
  const ma = Number(midAngle ?? (startAngle + endAngle) / 2)
  const cos = Math.cos(-RADIAN * ma)
  const sin = Math.sin(-RADIAN * ma)
  const pullPx = hovered ? 9 : 0
  const scale = hovered ? 1.07 : 1
  const d = REPORTS_PAGE_CONSTANTS.STATUS_PIE_NEON_DIM
  const idleNeon = isDark
    ? `drop-shadow(0 0 ${4 * d}px color-mix(in srgb, ${fill} 42%, transparent)) drop-shadow(0 0 ${8 * d}px ${fill}) drop-shadow(0 0 ${14 * d}px ${fill}88) brightness(${1 + 0.1 * d})`
    : `drop-shadow(0 0 ${3 * d}px ${fill}66) drop-shadow(0 0 ${8 * d}px ${fill}44) brightness(${1 + 0.04 * d})`
  const hoverBoost = hovered
    ? ` drop-shadow(0 0 ${9 * d}px ${fill}) drop-shadow(0 0 ${16 * d}px ${fill}99) brightness(${1 + 0.06 * d})`
    : ''
  const strokeW = hovered ? 1.35 : 0
  const strokeCol = strokeW > 0 ? (isDark ? fill : stroke ?? fill) : fill

  const gTransform = `translate(${pullPx * cos}px, ${pullPx * sin}px) translate(${cx}px, ${cy}px) scale(${scale}) translate(${-cx}px, ${-cy}px)`

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
        style={{ filter: `${idleNeon}${hoverBoost}`.trim() }}
      />
    </g>
  )
}
