export type BoardPageActionsProps = {
  isDark: boolean
  viewMode: 'board' | 'list'
  onToggleViewMode: () => void
  isRefreshing: boolean
  onRefresh: () => void
  canEditTasks: boolean
  onCreateTask: () => void
  onOpenProjectPicker: () => void
}
