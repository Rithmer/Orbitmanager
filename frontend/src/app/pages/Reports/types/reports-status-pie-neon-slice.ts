import type { ReportsStatusDistributionItem } from '@/app/features/reports'

export type StatusPieSliceProps = {
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

export type NeonStatusPieSliceProps = StatusPieSliceProps & {
  hoveredData: StatusPieSliceProps['payload'] | null
  isDark: boolean
}
