import { api, type ApiRequestOptions } from '@/app/api/client'
import type { TaskRiskOutput, ProjectRiskOutput } from '@/app/types'

export const riskApi = {
  getProjectRisk(projectId: number, options: ApiRequestOptions = {}): Promise<ProjectRiskOutput> {
    return api.get(`/projects/${projectId}/risk`, options)
  },

  getTaskRisk(taskId: number, options: ApiRequestOptions = {}): Promise<TaskRiskOutput> {
    return api.get(`/tasks/${taskId}/risk`, options)
  },

  getProjectTasksRisk(projectId: number, options: ApiRequestOptions = {}): Promise<Record<number, TaskRiskOutput>> {
    return api.get(`/projects/${projectId}/tasks-risk`, options)
  },

  getAllProjectsRisk(options: ApiRequestOptions = {}): Promise<Record<number, ProjectRiskOutput>> {
    return api.get('/risks/projects', options)
  },
}
