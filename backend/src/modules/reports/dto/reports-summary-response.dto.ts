export interface ReportsSummaryOverviewDto {
  doneTasks: number;
  inProgressTasks: number;
  reviewTasks: number;
  newTasks: number;
  overdueTasks: number;
  totalTasks: number;
  efficiency: number;
  projectCount: number;
}

export interface ReportsStatusDistributionItemDto {
  label: string;
  value: number;
  color: string;
}

export interface ReportsProjectTaskBreakdownItemDto {
  projectId: number;
  projectName: string;
  taskCount: number;
  completedTaskCount: number;
}

export interface ReportsDifficultyDistributionItemDto {
  difficulty: number;
  label: string;
  value: number;
}

export interface ReportsSummaryResponseDto {
  overview: ReportsSummaryOverviewDto;
  statusDistribution: ReportsStatusDistributionItemDto[];
  projectTaskBreakdown: ReportsProjectTaskBreakdownItemDto[];
  difficultyDistribution: ReportsDifficultyDistributionItemDto[];
}
