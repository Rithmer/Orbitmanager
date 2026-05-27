import type { AccountRole, User } from '@/app/types'

export type UsersTableProps = {
  cardBg: string
  cardBorder: string
  deferredSearchTerm: string
  emptyRowsCount: number
  isDark: boolean
  isRefreshing: boolean
  limit: number
  page: number
  roleColorFor: (role: AccountRole) => string
  rowHover: string
  showInitialSkeleton: boolean
  textPrimary: string
  textSecondary: string
  total: number
  totalPages: number
  users: User[]
  onDeleteUser: (id: number) => void
  onEditUser: (user: User) => void
  onOpenAuditForUser: (id: number) => void
  onPageChange: (page: number) => void
}
