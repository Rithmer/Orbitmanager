import { ApiProperty } from '@nestjs/swagger';
import type { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { TaskRiskOutputDto } from '@/modules/risk/dto';

export class ProjectBoardUserSummaryDto {
  @ApiProperty({ description: 'ID пользователя' })
  id!: number;

  @ApiProperty({ description: 'Логин пользователя' })
  login!: string;

  @ApiProperty({ description: 'Полное имя пользователя' })
  fullName!: string;

  @ApiProperty({ description: 'Должность пользователя' })
  profession!: string;
}

export class ProjectBoardMemberDto {
  @ApiProperty({ description: 'ID записи участника проекта' })
  id!: number;

  @ApiProperty({ description: 'ID пользователя' })
  userId!: number;

  @ApiProperty({ description: 'Роль в проекте', enum: ProjectRole })
  role!: ProjectRole;

  @ApiProperty({ description: 'Дата назначения на проект (ISO 8601)' })
  assignedAt!: string;

  @ApiProperty({ description: 'Краткая информация о пользователе', type: () => ProjectBoardUserSummaryDto })
  user!: ProjectBoardUserSummaryDto;
}

export class ProjectBoardProjectDto {
  @ApiProperty({ description: 'ID проекта' })
  id!: number;

  @ApiProperty({ description: 'ID команды' })
  teamId!: number;

  @ApiProperty({ description: 'Название проекта' })
  name!: string;

  @ApiProperty({ description: 'Описание проекта' })
  description!: string;

  @ApiProperty({ description: 'Статус проекта' })
  status!: string;

  @ApiProperty({ description: 'Дата создания проекта (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'Дата последнего обновления проекта (ISO 8601)' })
  updatedAt!: string;
}

export class ProjectBoardTaskDto {
  @ApiProperty({ description: 'ID задачи' })
  id!: number;

  @ApiProperty({ description: 'ID проекта' })
  projectId!: number;

  @ApiProperty({ description: 'Название задачи' })
  name!: string;

  @ApiProperty({ description: 'Описание задачи' })
  description!: string;

  @ApiProperty({ description: 'Дедлайн задачи (ISO 8601)' })
  deadline!: string;

  @ApiProperty({ description: 'Сложность задачи (1 — 5)' })
  difficulty!: number;

  @ApiProperty({ description: 'Статус задачи', enum: TaskStatus })
  status!: TaskStatus;

  @ApiProperty({ description: 'Список ID исполнителей', type: [Number] })
  assigneeIds!: number[];

  @ApiProperty({ description: 'Список исполнителей', type: () => [ProjectBoardUserSummaryDto] })
  assignees!: ProjectBoardUserSummaryDto[];

  /** @deprecated обратная совместимость — первый исполнитель или null */
  @ApiProperty({ description: 'ID первого исполнителя (устаревшее)', required: false, nullable: true })
  assigneeId!: number | null;

  @ApiProperty({ description: 'ID создателя задачи' })
  createdById!: number;

  @ApiProperty({ description: 'Дата создания задачи (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'Дата последнего обновления задачи (ISO 8601)' })
  updatedAt!: string;
}

export class ProjectBoardViewResponseDto {
  @ApiProperty({ description: 'Информация о проекте', type: () => ProjectBoardProjectDto })
  project!: ProjectBoardProjectDto;

  @ApiProperty({ description: 'Участники проекта', type: () => [ProjectBoardMemberDto] })
  members!: ProjectBoardMemberDto[];

  @ApiProperty({ description: 'Задачи проекта', type: () => [ProjectBoardTaskDto] })
  tasks!: ProjectBoardTaskDto[];

  @ApiProperty({ description: 'Риск-данные по задачам (ключ — ID задачи)', type: 'object' })
  riskByTaskId!: Record<number, TaskRiskOutputDto>;
}

export interface ProjectBoardViewQueryContext {
  userId: number;
  accountRole: AccountRole;
}
