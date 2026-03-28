import type { useProfileSettings } from '@/app/pages/Settings/hooks/useProfileSettings'
import type { useSettingsThemeTokens } from '@/app/pages/Settings/hooks/useSettingsThemeTokens'

export type SettingsProfileSectionProps = {
  theme: ReturnType<typeof useSettingsThemeTokens>
  profile: ReturnType<typeof useProfileSettings>
}
