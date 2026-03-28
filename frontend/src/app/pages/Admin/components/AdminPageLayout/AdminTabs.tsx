import { ADMIN_TABS } from '@/app/pages/Admin/constants'
import type { AdminPageTabsPort, AdminPageUiTokens } from '@/app/pages/Admin/types'

type AdminTabsProps = {
  ui: Pick<AdminPageUiTokens, 'tabActive' | 'tabInactive'>
  tabs: Pick<AdminPageTabsPort, 'activeTab' | 'setActiveTab'>
}

export function AdminTabs({ ui, tabs }: AdminTabsProps) {
  const { tabActive, tabInactive } = ui
  const { activeTab, setActiveTab: onTabChange } = tabs

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
