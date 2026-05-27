import type { usePasswordSettings } from '@/app/pages/Settings/hooks/usePasswordSettings'
import type { useSettingsThemeTokens } from '@/app/pages/Settings/hooks/useSettingsThemeTokens'

export type SettingsSecuritySectionProps = {
  theme: ReturnType<typeof useSettingsThemeTokens>
  password: ReturnType<typeof usePasswordSettings>
  onLogout: () => void
}
