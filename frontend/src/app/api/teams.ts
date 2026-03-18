import { api, buildQuery } from './client'
import type { Team, TeamMember, PaginatedResult, QueryParams } from '../types'

export const teamsApi = {
  list(params: QueryParams = {}): Promise<PaginatedResult<Team>> {
    return api.get(`/teams${buildQuery(params)}`)
  },

  getById(id: number): Promise<Team> {
    return api.get(`/teams/${id}`)
  },

  create(dto: { name: string; description?: string }): Promise<Team> {
    return api.post('/teams', dto)
  },

  update(id: number, dto: { name?: string; description?: string }): Promise<Team> {
    return api.patch(`/teams/${id}`, dto)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/teams/${id}`)
  },

  getMembers(teamId: number): Promise<TeamMember[]> {
    return api.get(`/teams/${teamId}/members`)
  },

  getAllMembersBatch(): Promise<Record<number, TeamMember[]>> {
    return api.get('/teams/members/batch')
  },

  addMember(teamId: number, dto: { userId: number; teamRole: string }): Promise<TeamMember> {
    return api.post(`/teams/${teamId}/members`, dto)
  },

  updateMember(memberId: number, dto: { teamRole: string }): Promise<TeamMember> {
    return api.patch(`/team-members/${memberId}`, dto)
  },

  removeMember(memberId: number): Promise<void> {
    return api.delete(`/team-members/${memberId}`)
  },
}
