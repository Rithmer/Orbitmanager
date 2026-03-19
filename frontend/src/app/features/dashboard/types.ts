import type { RiskLevel, TaskStatus } from '../../types'

export interface DashboardSummaryOverview {
  doneTasks: number
  inProgressTasks: number
  overdueTasks: number
  totalTasks: number
  progressPercent: number
  projectCount: number
}

export interface DashboardRecentTaskItem {
  id: number
  projectId: number
  projectName: string
  name: string
  status: TaskStatus
  statusLabel: string
  deadline: string
  assigneeName?: string | null
  isOverdue: boolean
}

export type DashboardRiskInsightType = 'error' | 'warning' | 'info'

export interface DashboardRiskInsight {
  taskId: number
  taskName: string
  projectId: number
  projectName: string
  delayProbability: number
  riskLevel: RiskLevel
  type: DashboardRiskInsightType
  message: string
  recommendation: string
}

export interface DashboardSummaryResponse {
  overview: DashboardSummaryOverview
  recentTasks: DashboardRecentTaskItem[]
  riskInsights: DashboardRiskInsight[]
}
