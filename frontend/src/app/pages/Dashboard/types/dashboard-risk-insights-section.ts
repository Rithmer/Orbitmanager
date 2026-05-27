import type { DashboardRiskInsight } from '@/app/features/dashboard/types'
import type { DashboardPageUiTokens } from '@/app/pages/Dashboard/types/dashboard-page-ui'

export type DashboardRiskInsightsSectionProps = {
  riskInsights: DashboardRiskInsight[]
  isRefreshing: boolean
  ui: Pick<DashboardPageUiTokens, 'cardBg' | 'cardBorder' | 'textSecondary' | 'insightStyles'>
}
