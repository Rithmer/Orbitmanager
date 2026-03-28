import { ADMIN_TABS, type AdminTab } from '@/app/pages/Admin/constants'

export function AdminTabs({
  activeTab,
  onTabChange,
  tabActive,
  tabInactive,
}: {
  activeTab: AdminTab
  onTabChange: (tab: AdminTab) => void
  tabActive: string
  tabInactive: string
}) {
  return (
    <div className="flex gap-2 mb-6 flex-wrap">
      {ADMIN_TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.key ? tabActive : tabInactive}`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  )
}
