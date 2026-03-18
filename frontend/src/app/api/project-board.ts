import { api, type ApiRequestOptions } from './client'
import type { ProjectBoardView } from '../features/board'

export const projectBoardApi = {
  getBoardView(
    projectId: number,
    options: ApiRequestOptions = {},
  ): Promise<ProjectBoardView> {
    return api.get(`/projects/${projectId}/board-view`, options)
  },
}
