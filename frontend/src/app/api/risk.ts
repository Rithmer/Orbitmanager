import { api } from './client'
import type { TaskRiskOutput, ProjectRiskOutput } from '../types'

export const riskApi = {
  getProjectRisk(projectId: number): Promise<ProjectRiskOutput> {
    return api.get(`/projects/${projectId}/risk`)
  },

  getTaskRisk(taskId: number): Promise<TaskRiskOutput> {
    return api.get(`/tasks/${taskId}/risk`)
  },
}
