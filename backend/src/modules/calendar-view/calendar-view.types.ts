import { ApiProperty } from '@nestjs/swagger';

export class CalendarViewProjectDto {
  @ApiProperty({ description: 'ID проекта' })
  id!: number;

  @ApiProperty({ description: 'Название проекта' })
  name!: string;

  @ApiProperty({ description: 'ID команды' })
  teamId!: number;
}

export class CalendarViewTaskDto {
  @ApiProperty({ description: 'ID задачи' })
  id!: number;

  @ApiProperty({ description: 'ID проекта' })
  projectId!: number;

  @ApiProperty({ description: 'Название проекта' })
  projectName!: string;

  @ApiProperty({ description: 'Название задачи' })
  name!: string;

  @ApiProperty({ description: 'Описание задачи' })
  description!: string;

  @ApiProperty({ description: 'Дедлайн задачи (ISO 8601)' })
  deadline!: string;

  @ApiProperty({ description: 'Статус задачи' })
  status!: string;

  @ApiProperty({ description: 'Сложность задачи (1 — 5)' })
  difficulty!: number;
}

export class CalendarViewEventDto {
  @ApiProperty({ description: 'ID события' })
  id!: number;

  @ApiProperty({ description: 'ID пользователя-владельца события' })
  userId!: number;

  @ApiProperty({
    description: 'ID связанного проекта',
    required: false,
    nullable: true,
  })
  projectId!: number | null;

  @ApiProperty({
    description: 'Название связанного проекта',
    required: false,
    nullable: true,
  })
  projectName!: string | null;

  @ApiProperty({
    description: 'ID связанной задачи',
    required: false,
    nullable: true,
  })
  taskId!: number | null;

  @ApiProperty({ description: 'Заголовок события' })
  title!: string;

  @ApiProperty({ description: 'Описание события' })
  description!: string;

  @ApiProperty({ description: 'Дата и время начала события (ISO 8601)' })
  startDate!: string;

  @ApiProperty({ description: 'Дата и время окончания события (ISO 8601)' })
  endDate!: string;

  @ApiProperty({ description: 'Признак события на весь день' })
  allDay!: boolean;

  @ApiProperty({ description: 'Цвет события для отображения в календаре' })
  color!: string;
}

export class CalendarMonthViewResponseDto {
  @ApiProperty({ description: 'Год' })
  year!: number;

  @ApiProperty({ description: 'Месяц (1 — 12)' })
  month!: number;

  @ApiProperty({
    description: 'Проекты пользователя в данном месяце',
    type: () => [CalendarViewProjectDto],
  })
  projects!: CalendarViewProjectDto[];

  @ApiProperty({
    description: 'Задачи с дедлайном в данном месяце',
    type: () => [CalendarViewTaskDto],
  })
  tasks!: CalendarViewTaskDto[];

  @ApiProperty({
    description: 'События календаря в данном месяце',
    type: () => [CalendarViewEventDto],
  })
  events!: CalendarViewEventDto[];
}
