import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { ProjectRiskOutputDto } from '@/modules/risk/dto';
import type { PaginatedResult } from '@/common/query/pagination';

export interface ProjectsListViewQueryParams {
  search?: string;
  teamId?: number;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export class ProjectListViewItemDto {
  @ApiProperty({ description: 'ID проекта' })
  id!: number;

  @ApiProperty({ description: 'ID команды' })
  teamId!: number;

  @ApiProperty({ description: 'Название команды' })
  teamName!: string;

  @ApiProperty({ description: 'Название проекта' })
  name!: string;

  @ApiProperty({ description: 'Описание проекта' })
  description!: string;

  @ApiProperty({ description: 'Статус проекта', enum: ProjectStatus })
  status!: ProjectStatus;

  @ApiProperty({ description: 'Дата создания проекта (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'Дата последнего обновления проекта (ISO 8601)' })
  updatedAt!: string;

  @ApiProperty({ description: 'Количество участников проекта' })
  memberCount!: number;

  @ApiProperty({
    description: 'Сводка рисков проекта',
    type: () => ProjectRiskOutputDto,
  })
  riskSummary!: ProjectRiskOutputDto;
}

export class ProjectsListViewResponseDto implements PaginatedResult<ProjectListViewItemDto> {
  @ApiProperty({
    description: 'Список проектов',
    type: () => [ProjectListViewItemDto],
  })
  items!: ProjectListViewItemDto[];

  @ApiProperty({ description: 'Общее количество проектов' })
  total!: number;

  @ApiProperty({ description: 'Текущая страница' })
  page!: number;

  @ApiProperty({ description: 'Количество элементов на странице' })
  limit!: number;

  @ApiProperty({ description: 'Общее количество страниц' })
  totalPages!: number;
}
