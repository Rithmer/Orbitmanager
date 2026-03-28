import type { ReportsThemeTokens } from '@/app/pages/Reports/hooks/useReportsThemeTokens'

export type ReportsNormalizedDifficultyRow = {
  difficulty: number
  label: string
  value: number
}

export type ReportsDifficultyLineSectionProps = {
  tokens: ReportsThemeTokens
  normalizedDifficultyDistribution: ReportsNormalizedDifficultyRow[]
}
