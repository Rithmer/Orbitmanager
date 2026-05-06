import { useTheme } from '@/app/context/useTheme'
import { useAuth } from '@/app/context/useAuth'
import { useAdminPageTabs } from '@/app/pages/Admin/hooks/useAdminPageTabs'
import type { AdminPageViewModel } from '@/app/pages/Admin/types'

export function useAdminPageController(): AdminPageViewModel {
  const { isDark } = useTheme()
  const { isAdmin } = useAuth()
  const tabs = useAdminPageTabs()

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const tabActive = 'bg-[#4880ff] text-white'
  const tabInactive = isDark ? 'bg-[#273142] text-[#94a3b8] hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'

  return {
    isAdmin,
    ui: {
      pageBg,
      textPrimary,
      textSecondary,
      tabActive,
      tabInactive,
    },
    tabs,
  }
}
