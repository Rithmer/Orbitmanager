import { AdminPageHeader, AdminTabs } from '@/app/pages/Admin/components/AdminPageLayout'
import { UsersPanel } from '@/app/pages/Admin/components/UsersPanel'
import { AuditPanel } from '@/app/pages/Admin/components/AuditPanel'
import { MlModelPanel } from '@/app/pages/Admin/components/MlModelPanel'
import type { AdminPageViewModel } from '@/app/pages/Admin/types'

type AdminPageViewProps = {
  model: AdminPageViewModel
}

export function AdminPageView({ model }: AdminPageViewProps) {
  const { ui, tabs } = model
  const { activeTab, auditPresetUserId, openAuditForUser } = tabs

  return (
    <div className={`${ui.pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <AdminPageHeader ui={ui} />
      <AdminTabs ui={ui} tabs={tabs} />

      {activeTab === 'users' ? <UsersPanel onOpenAuditForUser={openAuditForUser} /> : null}
      {activeTab === 'audit' ? <AuditPanel key={auditPresetUserId ?? 'audit'} presetUserId={auditPresetUserId} /> : null}
      {activeTab === 'ml-model' ? <MlModelPanel /> : null}
    </div>
  )
}
