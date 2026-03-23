import { ApiProperty } from '@nestjs/swagger';

export class ReportsSummaryOverviewDto {
  @ApiProperty({ description: 'Количество выполненных задач' })
  doneTasks!: number;

  @ApiProperty({ description: 'Количество задач в работе' })
  inProgressTasks!: number;

  @ApiProperty({ description: 'Количество задач на проверке' })
  reviewTasks!: number;

  @ApiProperty({ description: 'Количество новых задач' })
  newTasks!: number;

  @ApiProperty({ description: 'Количество просроченных задач' })
  overdueTasks!: number;

  @ApiProperty({ description: 'Общее количество задач' })
  totalTasks!: number;

  @ApiProperty({ description: 'Эффективность команды (0 — 100)' })
  efficiency!: number;

  @ApiProperty({ description: 'Количество проектов' })
  projectCount!: number;
}

export class ReportsStatusDistributionItemDto {
  @ApiProperty({ description: 'Метка статуса' })
  label!: string;

  @ApiProperty({ description: 'Количество задач с данным статусом' })
  value!: number;

  @ApiProperty({ description: 'Цвет для отображения на диаграмме' })
  color!: string;
}

export class ReportsProjectTaskBreakdownItemDto {
  @ApiProperty({ description: 'ID проекта' })
  projectId!: number;

  @ApiProperty({ description: 'Название проекта' })
  projectName!: string;

  @ApiProperty({ description: 'Общее количество задач в проекте' })
  taskCount!: number;

  @ApiProperty({ description: 'Количество выполненных задач в проекте' })
  completedTaskCount!: number;
}

export class ReportsDifficultyDistributionItemDto {
  @ApiProperty({ description: 'Уровень сложности задачи' })
  difficulty!: number;

  @ApiProperty({ description: 'Метка уровня сложности' })
  label!: string;

  @ApiProperty({ description: 'Количество задач с данной сложностью' })
  value!: number;
}

export class ReportsSummaryResponseDto {
  @ApiProperty({ description: 'Сводка показателей', type: () => ReportsSummaryOverviewDto })
  overview!: ReportsSummaryOverviewDto;

  @ApiProperty({ description: 'Распределение задач по статусам', type: () => [ReportsStatusDistributionItemDto] })
  statusDistribution!: ReportsStatusDistributionItemDto[];

  @ApiProperty({ description: 'Разбивка задач по проектам', type: () => [ReportsProjectTaskBreakdownItemDto] })
  projectTaskBreakdown!: ReportsProjectTaskBreakdownItemDto[];

  @ApiProperty({ description: 'Распределение задач по сложности', type: () => [ReportsDifficultyDistributionItemDto] })
  difficultyDistribution!: ReportsDifficultyDistributionItemDto[];
}
