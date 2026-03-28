export type PiePercentLabelProps = {
  cx?: string | number
  cy?: string | number
  midAngle?: number
  innerRadius?: string | number
  outerRadius?: string | number
  percent?: number
}

export type StatusPiePercentLabelProps = PiePercentLabelProps & { isDark: boolean }

export type StatusPieCenterTotalLabelProps = {
  viewBox: unknown
  isDark: boolean
  statusTotal: number
  centerSubFill: string
  centerLabelFill: string
}
