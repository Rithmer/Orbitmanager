import { ApiProperty } from '@nestjs/swagger';

class TaskAtRiskDto {
  @ApiProperty({ description: 'ID задачи', example: 1 })
  taskId!: number;

  @ApiProperty({
    description: 'Название задачи',
    example: 'Реализовать авторизацию',
  })
  taskName!: string;

  @ApiProperty({
    description: 'Вероятность задержки',
    example: 0.72,
    minimum: 0,
    maximum: 1,
  })
  delayProbability!: number;
}

export class ProjectRiskOutputDto {
  @ApiProperty({
    description: 'Оценка риска проекта (0 — 100)',
    example: 55,
    minimum: 0,
    maximum: 100,
  })
  riskScore!: number;

  @ApiProperty({
    description: 'Уровень риска',
    example: 'medium',
    enum: ['low', 'medium', 'high'],
  })
  riskLevel!: 'low' | 'medium' | 'high';

  @ApiProperty({
    description: 'Задачи с повышенным риском',
    type: [TaskAtRiskDto],
  })
  tasksAtRisk!: TaskAtRiskDto[];

  @ApiProperty({
    description: 'Текстовое пояснение по рискам проекта',
    example:
      'Проект имеет средний уровень риска (55/100). 3 из 8 активных задач требуют внимания.',
  })
  summary!: string;
}
