import { ApiProperty } from '@nestjs/swagger';

export class TaskRiskOutputDto {
  @ApiProperty({ description: 'Прогнозируемая дата завершения', example: '2026-04-01T12:00:00.000Z' })
  predictedCompletionDate!: string;

  @ApiProperty({ description: 'Вероятность задержки (0.0 — 1.0)', example: 0.45, minimum: 0, maximum: 1 })
  delayProbability!: number;

  @ApiProperty({ description: 'Уровень риска', example: 'medium', enum: ['low', 'medium', 'high'] })
  riskLevel!: 'low' | 'medium' | 'high';

  @ApiProperty({ description: 'Ключевые факторы риска', example: ['Близкий дедлайн', 'Высокая сложность'] })
  riskFactors!: string[];

  @ApiProperty({ description: 'Рекомендация по снижению риска', example: 'Контролируйте ход выполнения задачи ежедневно.' })
  recommendation!: string;
}
