import { api, buildQuery, type ApiRequestOptions } from './client'
import type { Task, PaginatedResult, QueryParams } from '../types'

export const tasksApi = {
  list(params: QueryParams = {}, options: ApiRequestOptions = {}): Promise<PaginatedResult<Task>> {
    return api.get(`/tasks${buildQuery(params)}`, options)
  },

  getById(id: number, options: ApiRequestOptions = {}): Promise<Task> {
    return api.get(`/tasks/${id}`, options)
  },

  create(dto: {
    projectId: number
    name: string
    description?: string
    deadline: string
    difficulty: number
    assigneeIds?: number[]
  }): Promise<Task> {
    return api.post('/tasks', dto)
  },

  update(
    id: number,
    dto: Partial<{
      name: string
      description: string
      deadline: string
      difficulty: number
      status: string
      assigneeIds: number[]
    }>,
  ): Promise<Task> {
    return api.patch(`/tasks/${id}`, dto)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/tasks/${id}`)
  },
}
