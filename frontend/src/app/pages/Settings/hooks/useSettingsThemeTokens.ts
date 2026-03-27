import { useTheme } from '@/app/context/useTheme'
import { usePageThemeTokens } from '@/app/hooks/usePageThemeTokens'

export function useSettingsThemeTokens() {
  const { toggleTheme } = useTheme()
  const base = usePageThemeTokens()

  return {
    isDark: base.isDark,
    toggleTheme,
    pageBg: base.pageBg,
    cardBg: base.cardBg,
    cardBorder: base.cardBorder,
    textPrimary: base.textPrimary,
    textSecondary: base.textSecondary,
    dividerColor: base.dividerColor,
    inputBg: base.isDark ? 'bg-[#1c2534] border-[#313d4f]' : 'bg-gray-50 border-gray-200',
    inputText: base.isDark ? 'text-[#f4f3f2]' : 'text-[#202224]',
    sectionIconBg: base.isDark ? 'bg-[#4880ff]/15' : 'bg-blue-50',
  }
}
