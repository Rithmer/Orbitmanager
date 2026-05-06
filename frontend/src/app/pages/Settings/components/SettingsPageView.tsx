import type { useSettingsPageController } from '@/app/pages/Settings/hooks/useSettingsPageController'
import { SettingsPageHeader } from '@/app/pages/Settings/components/SettingsPageHeader'
import {
  SettingsProfileSection,
  SettingsAppearanceSection,
  SettingsSecuritySection,
} from '@/app/pages/Settings/components/SettingsSections'

type SettingsPageControllerModel = ReturnType<typeof useSettingsPageController>

type SettingsPageViewProps = {
  model: SettingsPageControllerModel
}

export function SettingsPageView({ model }: SettingsPageViewProps) {
  const { theme, profile, password, onLogout } = model

  return (
    <div className={`${theme.pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <SettingsPageHeader textPrimary={theme.textPrimary} textSecondary={theme.textSecondary} />
      <div className="max-w-3xl space-y-6 page-load-stagger">
        <SettingsProfileSection theme={theme} profile={profile} />
        <SettingsAppearanceSection theme={theme} />
        <SettingsSecuritySection theme={theme} password={password} onLogout={onLogout} />
      </div>
    </div>
  )
}
