import type { AdminTab } from '@/app/pages/Admin/types/admin'

export type AdminPageUiTokens = {
  pageBg: string
  textPrimary: string
  textSecondary: string
  tabActive: string
  tabInactive: string
}

export type AdminPageTabsPort = {
  activeTab: AdminTab
  setActiveTab: (tab: AdminTab) => void
  auditPresetUserId: number | null
  openAuditForUser: (userId: number) => void
}

export type AdminPageViewModel = {
  isAdmin: boolean
  ui: AdminPageUiTokens
  tabs: AdminPageTabsPort
}
