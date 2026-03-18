import { api, buildQuery } from './client'
import type { Project, ProjectMember, PaginatedResult, QueryParams } from '../types'

export const projectsApi = {
  list(params: QueryParams = {}): Promise<PaginatedResult<Project>> {
    return api.get(`/projects${buildQuery(params)}`)
  },

  getById(id: number): Promise<Project> {
    return api.get(`/projects/${id}`)
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

  getMembers(projectId: number): Promise<ProjectMember[]> {
    return api.get(`/projects/${projectId}/members`)
  },

  getAllMembersBatch(): Promise<Record<number, ProjectMember[]>> {
    return api.get('/projects/members/batch')
  },

  addMember(
    projectId: number,
    dto: { userId: number; role: string },
  ): Promise<ProjectMember> {
    return api.post(`/projects/${projectId}/members`, dto)
  },

  updateMember(memberId: number, dto: { role: string }): Promise<ProjectMember> {
    return api.patch(`/project-members/${memberId}`, dto)
  },

  removeMember(memberId: number): Promise<void> {
    return api.delete(`/project-members/${memberId}`)
  },
}
