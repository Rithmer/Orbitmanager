import { ApiProperty } from '@nestjs/swagger';
import { TeamRole } from '@/common/enums/team-role.enum';
import type { PaginatedResult } from '@/common/query/pagination';

export interface TeamsListViewQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export class TeamListViewUserSummaryDto {
  @ApiProperty({ description: 'ID пользователя' })
  id!: number;

  @ApiProperty({ description: 'Логин пользователя' })
  login!: string;

  @ApiProperty({ description: 'Полное имя пользователя' })
  fullName!: string;

  @ApiProperty({ description: 'Должность пользователя' })
  profession!: string;
}

export class TeamListViewMemberDto {
  @ApiProperty({ description: 'ID записи участника команды' })
  id!: number;

  @ApiProperty({ description: 'ID пользователя' })
  userId!: number;

  @ApiProperty({ description: 'ID команды' })
  teamId!: number;

  @ApiProperty({ description: 'Роль пользователя в команде', enum: TeamRole })
  teamRole!: TeamRole;

  @ApiProperty({ description: 'Краткая информация о пользователе', type: () => TeamListViewUserSummaryDto })
  user!: TeamListViewUserSummaryDto;
}

export class TeamListViewItemDto {
  @ApiProperty({ description: 'ID команды' })
  id!: number;

  @ApiProperty({ description: 'Название команды' })
  name!: string;

  @ApiProperty({ description: 'Описание команды' })
  description!: string;

  @ApiProperty({ description: 'Дата создания команды (ISO 8601)' })
  createdAt!: string;

  @ApiProperty({ description: 'ID создателя команды' })
  createdById!: number;

  @ApiProperty({ description: 'Количество участников команды' })
  memberCount!: number;

  @ApiProperty({ description: 'Роль текущего пользователя в команде', enum: TeamRole, required: false, nullable: true })
  currentUserRole!: TeamRole | null;

  @ApiProperty({ description: 'Список участников команды', type: () => [TeamListViewMemberDto] })
  members!: TeamListViewMemberDto[];
}

export class TeamsListViewResponseDto implements PaginatedResult<TeamListViewItemDto> {
  @ApiProperty({ description: 'Список команд', type: () => [TeamListViewItemDto] })
  items!: TeamListViewItemDto[];

  @ApiProperty({ description: 'Общее количество команд' })
  total!: number;

  @ApiProperty({ description: 'Текущая страница' })
  page!: number;

  @ApiProperty({ description: 'Количество элементов на странице' })
  limit!: number;

  @ApiProperty({ description: 'Общее количество страниц' })
  totalPages!: number;
}
