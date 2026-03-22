import { RiskLevel } from '@/common/enums/risk-level.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';

export interface DashboardSummaryOverviewDto {
  doneTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  totalTasks: number;
  progressPercent: number;
  projectCount: number;
}

export interface DashboardRecentTaskItemDto {
  id: number;
  projectId: number;
  projectName: string;
  name: string;
  status: TaskStatus;
  statusLabel: string;
  deadline: string;
  assigneeName?: string | null;
  assigneeNames: string[];
  assigneeCount: number;
  isOverdue: boolean;
}

export type DashboardRiskInsightType = 'error' | 'warning' | 'info';

export interface DashboardRiskInsightDto {
  taskId: number;
  taskName: string;
  projectId: number;
  projectName: string;
  delayProbability: number;
  riskLevel: RiskLevel;
  type: DashboardRiskInsightType;
  message: string;
  recommendation: string;
}

export interface DashboardSummaryResponseDto {
  overview: DashboardSummaryOverviewDto;
  recentTasks: DashboardRecentTaskItemDto[];
  riskInsights: DashboardRiskInsightDto[];
}
