import { api, buildQuery, type ApiRequestOptions } from './client'
import type { Team, TeamMember, PaginatedResult, QueryParams } from '../types'

export const teamsApi = {
  list(params: QueryParams = {}, options: ApiRequestOptions = {}): Promise<PaginatedResult<Team>> {
    return api.get(`/teams${buildQuery(params)}`, options)
  },

  getById(id: number, options: ApiRequestOptions = {}): Promise<Team> {
    return api.get(`/teams/${id}`, options)
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

  getMembers(teamId: number, options: ApiRequestOptions = {}): Promise<TeamMember[]> {
    return api.get(`/teams/${teamId}/members`, options)
  },

  getAllMembersBatch(options: ApiRequestOptions = {}): Promise<Record<number, TeamMember[]>> {
    return api.get('/teams/members/batch', options)
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
