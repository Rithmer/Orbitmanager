import { useSettingsPageController } from '@/app/pages/Settings/hooks/useSettingsPageController'
import { SettingsPageView } from '@/app/pages/Settings/components/SettingsPageView'

export function SettingsPageContent() {
  const model = useSettingsPageController()
  return <SettingsPageView model={model} />
}
