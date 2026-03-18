import type { ProjectStatus } from '@/common/enums/project-status.enum';
import type { PaginatedResult } from '@/common/query/pagination';
import type { ProjectRiskOutputDto } from '@/modules/risk/dto';

export interface ProjectsListViewQueryParams {
  search?: string;
  teamId?: number;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ProjectListViewItemDto {
  id: number;
  teamId: number;
  teamName: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  riskSummary: ProjectRiskOutputDto;
}

export type ProjectsListViewResponseDto = PaginatedResult<ProjectListViewItemDto>;
