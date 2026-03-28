import { useState } from 'react'
import type { AdminTab } from '@/app/pages/Admin/constants'

export function useAdminPageTabs() {
  const [activeTab, setActiveTab] = useState<AdminTab>('users')
  const [auditPresetUserId, setAuditPresetUserId] = useState<number | null>(null)

  const openAuditForUser = (userId: number) => {
    setAuditPresetUserId(userId)
    setActiveTab('audit')
  }

  return {
    activeTab,
    setActiveTab,
    auditPresetUserId,
    openAuditForUser,
  }
}
