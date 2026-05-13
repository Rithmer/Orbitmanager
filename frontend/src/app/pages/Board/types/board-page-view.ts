import type { UseQueryResult } from '@tanstack/react-query'
import type { ProjectsListViewItem } from '@/app/features/projects'
import type { PaginatedResult } from '@/app/types'
import type { BoardPageLoadedBodyProps } from '@/app/pages/Board/types/board-page-loaded-body'

export type BoardPageShellPort = {
  onToggleViewMode: () => void
  boardIsFetching: boolean
  onBoardRefresh: () => void
  onCreateTask: () => void
  onOpenProjectPicker: () => void
}

export type BoardPageViewModel =
  | { phase: 'initial_skeleton'; pageBg: string }
  | { phase: 'picker_skeleton'; pageBg: string }
  | {
      phase: 'picker'
      pageBg: string
      textPrimary: string
      textSecondary: string
      isDark: boolean
      projectPickerSearch: string
      onSearchChange: (q: string) => void
      pickerProjects: ProjectsListViewItem[]
      pickerProjectsAll: ProjectsListViewItem[]
      projectPickerQuery: UseQueryResult<PaginatedResult<ProjectsListViewItem>, Error>
      onOpenProject: (id: number) => void
    }
  | {
      phase: 'board_error'
      pageBg: string
      textPrimary: string
      textSecondary: string
      error: unknown
      onRetry: () => void
    }
  | { phase: 'board_pending' }
  | {
      phase: 'board_loaded'
      pageBg: string
      shell: BoardPageShellPort
      body: BoardPageLoadedBodyProps
    }
