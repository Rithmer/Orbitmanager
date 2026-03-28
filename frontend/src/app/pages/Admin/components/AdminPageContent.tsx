import { Navigate } from 'react-router'
import { useTheme } from '@/app/context/useTheme'
import { useAuth } from '@/app/context/useAuth'
import { AdminPageHeader } from '@/app/pages/Admin/components/AdminPageHeader'
import { AdminTabs } from '@/app/pages/Admin/components/AdminTabs'
import { UsersPanel } from '@/app/pages/Admin/components/UsersPanel'
import { AuditPanel } from '@/app/pages/Admin/components/AuditPanel'
import { MlModelPanel } from '@/app/pages/Admin/components/MlModelPanel'
import { useAdminPageTabs } from '@/app/pages/Admin/hooks/useAdminPageTabs'

export function AdminPageContent() {
  const { isDark } = useTheme()
  const { isAdmin } = useAuth()
  const { activeTab, setActiveTab, auditPresetUserId, openAuditForUser } = useAdminPageTabs()

  if (!isAdmin) return <Navigate to="/" replace />

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const tabActive = 'bg-[#4880ff] text-white'
  const tabInactive = isDark ? 'bg-[#273142] text-[#94a3b8] hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <AdminPageHeader textPrimary={textPrimary} textSecondary={textSecondary} />
      <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} tabActive={tabActive} tabInactive={tabInactive} />

      {activeTab === 'users' && (
        <UsersPanel onOpenAuditForUser={openAuditForUser} />
      )}
      {activeTab === 'audit' && <AuditPanel key={auditPresetUserId ?? 'audit'} presetUserId={auditPresetUserId} />}
      {activeTab === 'ml-model' && <MlModelPanel />}
    </div>
  )
}
