import type { LucideIcon } from 'lucide-react'
import type { DashboardPageUiTokens } from '@/app/pages/Dashboard/types/dashboard-page-ui'

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
  ui: Pick<DashboardPageUiTokens, 'cardBg' | 'cardBorder' | 'textPrimary' | 'textSecondary'>
}
