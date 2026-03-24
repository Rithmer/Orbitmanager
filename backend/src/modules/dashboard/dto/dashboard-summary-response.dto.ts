import { ApiProperty } from '@nestjs/swagger';
import { RiskLevel } from '@/common/enums/risk-level.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';

export class DashboardSummaryOverviewDto {
  @ApiProperty({ description: 'Количество выполненных задач' })
  doneTasks!: number;

  @ApiProperty({ description: 'Количество задач в работе' })
  inProgressTasks!: number;

  @ApiProperty({ description: 'Количество задач на проверке' })
  reviewTasks!: number;

  @ApiProperty({ description: 'Количество просроченных задач' })
  overdueTasks!: number;

  @ApiProperty({ description: 'Общее количество задач' })
  totalTasks!: number;

  @ApiProperty({ description: 'Процент выполнения проектов' })
  progressPercent!: number;

  @ApiProperty({ description: 'Количество проектов' })
  projectCount!: number;
}

export class DashboardRecentTaskItemDto {
  @ApiProperty({ description: 'ID задачи' })
  id!: number;

  @ApiProperty({ description: 'ID проекта' })
  projectId!: number;

  @ApiProperty({ description: 'Название проекта' })
  projectName!: string;

  @ApiProperty({ description: 'Название задачи' })
  name!: string;

  @ApiProperty({ description: 'Статус задачи', enum: TaskStatus })
  status!: TaskStatus;

  @ApiProperty({ description: 'Метка статуса задачи' })
  statusLabel!: string;

  @ApiProperty({ description: 'Дедлайн задачи (ISO 8601)' })
  deadline!: string;

  @ApiProperty({ description: 'Имя первого исполнителя', required: false, nullable: true })
  assigneeName?: string | null;

  @ApiProperty({ description: 'Имена всех исполнителей', type: [String] })
  assigneeNames!: string[];

  @ApiProperty({ description: 'Количество исполнителей' })
  assigneeCount!: number;

  @ApiProperty({ description: 'Признак просрочки задачи' })
  isOverdue!: boolean;
}

export type DashboardRiskInsightType = 'error' | 'warning' | 'info';

export class DashboardRiskInsightDto {
  @ApiProperty({ description: 'ID задачи' })
  taskId!: number;

  @ApiProperty({ description: 'Название задачи' })
  taskName!: string;

  @ApiProperty({ description: 'ID проекта' })
  projectId!: number;

  @ApiProperty({ description: 'Название проекта' })
  projectName!: string;

  @ApiProperty({ description: 'Вероятность задержки (0.0 — 1.0)' })
  delayProbability!: number;

  @ApiProperty({ description: 'Уровень риска', enum: RiskLevel })
  riskLevel!: RiskLevel;

  @ApiProperty({ description: 'Тип инсайта', enum: ['error', 'warning', 'info'] })
  type!: DashboardRiskInsightType;

  @ApiProperty({ description: 'Сообщение о риске' })
  message!: string;

  @ApiProperty({ description: 'Рекомендация по снижению риска' })
  recommendation!: string;
}

export class DashboardSummaryResponseDto {
  @ApiProperty({ description: 'Сводка показателей', type: () => DashboardSummaryOverviewDto })
  overview!: DashboardSummaryOverviewDto;

  @ApiProperty({ description: 'Последние задачи', type: () => [DashboardRecentTaskItemDto] })
  recentTasks!: DashboardRecentTaskItemDto[];

  @ApiProperty({ description: 'Инсайты по рискам задач', type: () => [DashboardRiskInsightDto] })
  riskInsights!: DashboardRiskInsightDto[];
}
