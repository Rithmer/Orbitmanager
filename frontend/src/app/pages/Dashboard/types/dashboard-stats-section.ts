import type { LucideIcon } from 'lucide-react'

export type DashboardStat = {
  label: string
  value: string
  change: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

export type DashboardStatsSectionProps = {
  stats: DashboardStat[]
  isRefreshing: boolean
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
}
