import type { useSettingsThemeTokens } from '@/app/pages/Settings/hooks/useSettingsThemeTokens'

export type SettingsAppearanceSectionProps = {
  theme: ReturnType<typeof useSettingsThemeTokens>
}
