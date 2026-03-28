import type { ReportsStatusDistributionItem } from '@/app/features/reports'
import type { ReportsThemeTokens } from '@/app/pages/Reports/hooks/useReportsThemeTokens'

export type ReportsStatusPieSectionProps = {
  tokens: ReportsThemeTokens
  isDark: boolean
  statusDistribution: ReportsStatusDistributionItem[]
  statusTotal: number
  isRefreshing?: boolean
}
