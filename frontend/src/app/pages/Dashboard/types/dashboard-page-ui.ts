import type { useDashboardThemeTokens } from '@/app/pages/Dashboard/hooks/useDashboardThemeTokens'

export type DashboardPageUiTokens = {
  isDark: boolean
  textPrimary: string
  textSecondary: string
  cardBg: string
  cardBorder: string
  dividerColor: string
  statusStyles: ReturnType<typeof useDashboardThemeTokens>['statusStyles']
  insightStyles: ReturnType<typeof useDashboardThemeTokens>['insightStyles']
}
