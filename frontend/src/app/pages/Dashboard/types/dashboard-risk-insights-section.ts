import type { DashboardRiskInsight } from '@/app/features/dashboard/types'

export type DashboardRiskInsightsSectionProps = {
  riskInsights: DashboardRiskInsight[]
  isRefreshing: boolean
  cardBg: string
  cardBorder: string
  textSecondary: string
  insightStyles: {
    error: { bg: string; border: string; text: string; dot: string }
    warning: { bg: string; border: string; text: string; dot: string }
    info: { bg: string; border: string; text: string; dot: string }
  }
}
