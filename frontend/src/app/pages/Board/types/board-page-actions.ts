import type { BoardPageLoadedBodyProps } from '@/app/pages/Board/types/board-page-loaded-body'
import type { BoardPageShellPort } from '@/app/pages/Board/types/board-page-view'

export type BoardPageActionsProps = {
  shell: BoardPageShellPort
  body: Pick<BoardPageLoadedBodyProps, 'isDark' | 'viewMode' | 'canEditTasks'>
}
