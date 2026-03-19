import type { TeamRole, PaginatedResult } from '../../types'

export interface TeamsListViewUserSummary {
  id: number
  login: string
  fullName: string
  profession: string
}

export interface TeamsListViewMember {
  id: number
  userId: number
  teamId: number
  teamRole: TeamRole
  user: TeamsListViewUserSummary
}

export interface TeamsListViewItem {
  id: number
  name: string
  description: string
  createdAt: string
  createdById: number
  memberCount: number
  currentUserRole: TeamRole | null
  members: TeamsListViewMember[]
}

export interface TeamsListViewQueryParams {
  page: number
  limit: number
  search?: string
  sort?: string
}

export type TeamsListViewResponse = PaginatedResult<TeamsListViewItem>
