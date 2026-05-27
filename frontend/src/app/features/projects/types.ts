import type { PaginatedResult, ProjectRiskOutput, ProjectStatus, TeamMember } from '@/app/types'

export interface ProjectsListViewItem {
  id: number
  teamId: number
  teamName: string
  name: string
  description: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
  memberCount: number
  riskSummary: ProjectRiskOutput
}

export interface ProjectsListViewQueryParams {
  page: number
  limit: number
  search?: string
  teamId?: number
  status?: ProjectStatus | ''
  sort?: string
}

export type ProjectsListViewResponse = PaginatedResult<ProjectsListViewItem>

export interface ProjectTeamMemberOption {
  userId: number
  userName: string
  login: string
}

export interface ProjectMemberRecord {
  id: number
  projectId: number
  userId: number
  role: string
  assignedAt: string
}

export type ProjectTeamMemberRecord = TeamMember
