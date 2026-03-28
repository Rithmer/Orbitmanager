import type { DashboardRecentTaskItem } from '@/app/features/dashboard/types'
import type { AuditAction } from '@/app/types'

export type DashboardAuditLogItem = {
  id: number
  action: AuditAction
  description?: string | null
  entityType: string
  userId: number
  timestamp: string
}

export type DashboardRecentActivitySectionProps = {
  isAdmin: boolean
  recentTasks: DashboardRecentTaskItem[]
  recentAudit: DashboardAuditLogItem[]
  isRefreshing: boolean
  isAuditRefreshing: boolean
  cardBg: string
  cardBorder: string
  dividerColor: string
  textPrimary: string
  textSecondary: string
  isDark: boolean
  statusStyles: Record<string, { color: string; bg: string; dot: string }>
  onOpenProjectBoard: (projectId: number) => void
}
