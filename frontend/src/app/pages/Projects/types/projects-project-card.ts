import type { ProjectsListViewItem } from '@/app/features/projects/types'
import type { ProjectStatus as ProjectStatusType } from '@/app/types'

export type ProjectsProjectCardProps = {
  cardColor: string
  dividerColor: string
  isDark: boolean
  isDeletePending: boolean
  isMenuOpen: boolean
  moreIconColor: string
  project: ProjectsListViewItem
  projectIndex: number
  statusClassMap: Record<ProjectStatusType, { bg: string; text: string }>
  textPrimary: string
  textSecondary: string
  onCloseMenu: () => void
  onDelete: () => void
  onNavigateToBoard: () => void
  onOpenEdit: () => void
  onOpenMembers: () => void
  onToggleMenu: () => void
}
