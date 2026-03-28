import type { DashboardRecentTaskItem } from '@/app/features/dashboard/types'
import type { AuditAction } from '@/app/types'
import type { DashboardPageUiTokens } from '@/app/pages/Dashboard/types/dashboard-page-ui'

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
  ui: DashboardPageUiTokens
  onOpenProjectBoard: (projectId: number) => void
}
