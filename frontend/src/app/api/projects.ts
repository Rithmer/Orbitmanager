import { api, buildQuery, type ApiRequestOptions } from './client'
import type { Project, ProjectMember, PaginatedResult, QueryParams } from '../types'

export const projectsApi = {
  list(params: QueryParams = {}, options: ApiRequestOptions = {}): Promise<PaginatedResult<Project>> {
    return api.get(`/projects${buildQuery(params)}`, options)
  },

  getById(id: number, options: ApiRequestOptions = {}): Promise<Project> {
    return api.get(`/projects/${id}`, options)
  },

  create(dto: {
    name: string
    description?: string
    teamId: number
    status?: string
  }): Promise<Project> {
    return api.post('/projects', dto)
  },

  update(
    id: number,
    dto: { name?: string; description?: string; status?: string },
  ): Promise<Project> {
    return api.patch(`/projects/${id}`, dto)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/projects/${id}`)
  },

  getMembers(projectId: number, options: ApiRequestOptions = {}): Promise<ProjectMember[]> {
    return api.get(`/projects/${projectId}/members`, options)
  },

  getAllMembersBatch(options: ApiRequestOptions = {}): Promise<Record<number, ProjectMember[]>> {
    return api.get('/projects/members/batch', options)
  },

  addMember(
    projectId: number,
    dto: { userId: number; role: string },
  ): Promise<ProjectMember> {
    return api.post(`/projects/${projectId}/members`, dto)
  },

  updateMember(projectId: number, memberId: number, dto: { role: string }): Promise<ProjectMember> {
    return api.patch(`/projects/${projectId}/members/${memberId}`, dto)
  },

  removeMember(projectId: number, memberId: number): Promise<void> {
    return api.delete(`/projects/${projectId}/members/${memberId}`)
  },
}
