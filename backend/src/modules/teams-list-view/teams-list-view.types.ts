import type { TeamRole } from '@/common/enums/team-role.enum';
import type { PaginatedResult } from '@/common/query/pagination';

export interface TeamsListViewQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface TeamListViewUserSummaryDto {
  id: number;
  login: string;
  fullName: string;
  profession: string;
}

export interface TeamListViewMemberDto {
  id: number;
  userId: number;
  teamId: number;
  teamRole: TeamRole;
  user: TeamListViewUserSummaryDto;
}

export interface TeamListViewItemDto {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  createdById: number;
  memberCount: number;
  currentUserRole: TeamRole | null;
  members: TeamListViewMemberDto[];
}

export type TeamsListViewResponseDto = PaginatedResult<TeamListViewItemDto>;
