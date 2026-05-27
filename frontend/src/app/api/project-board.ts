import { api, type ApiRequestOptions } from '@/app/api/client'
import type { ProjectBoardView } from '@/app/features/board'

export const projectBoardApi = {
  getBoardView(
    projectId: number,
    options: ApiRequestOptions = {},
  ): Promise<ProjectBoardView> {
    return api.get(`/projects/${projectId}/board-view`, options)
  },
}
