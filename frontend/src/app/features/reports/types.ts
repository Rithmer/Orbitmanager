export interface ReportsSummaryOverview {
  doneTasks: number
  inProgressTasks: number
  newTasks: number
  overdueTasks: number
  totalTasks: number
  efficiency: number
  projectCount: number
}

export interface ReportsStatusDistributionItem {
  label: string
  value: number
  color: string
}

export interface ReportsProjectTaskBreakdownItem {
  projectId: number
  projectName: string
  taskCount: number
  completedTaskCount: number
}

export interface ReportsDifficultyDistributionItem {
  difficulty: number
  label: string
  value: number
}

export interface ReportsSummaryResponse {
  overview: ReportsSummaryOverview
  statusDistribution: ReportsStatusDistributionItem[]
  projectTaskBreakdown: ReportsProjectTaskBreakdownItem[]
  difficultyDistribution: ReportsDifficultyDistributionItem[]
}

export interface ReportsAccessibleProject {
  id: number
  name: string
}
