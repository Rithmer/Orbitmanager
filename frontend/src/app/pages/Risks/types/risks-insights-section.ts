import type { RiskTaskInsight } from '@/app/features/risks/types'

export type RisksInsightAssignee = {
  userId: number
  fullName: string
  fitScore: number
  role: string
  profession: string
}

export type RisksInsightsSectionProps = {
  selectedTeamId: number | undefined
  selectedCard: { taskInsights: RiskTaskInsight[] } | undefined
  sortedTaskInsights: RiskTaskInsight[]
  selectedTask: RiskTaskInsight | undefined
  topRecommendedAssignees: RisksInsightAssignee[]
  cardBg: string
  cardBorder: string
  panelMuted: string
  textSecondary: string
  divider: string
  expandedAlternativesByTaskId: Record<number, boolean>
  onSelectTask: (taskId: number) => void
  onToggleAlternatives: (taskId: number) => void
}
