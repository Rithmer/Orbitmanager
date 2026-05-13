import { useNavigate } from 'react-router'
import { useAuth } from '@/app/context/useAuth'
import { useSettingsThemeTokens } from '@/app/pages/Settings/hooks/useSettingsThemeTokens'
import { useProfileSettings } from '@/app/pages/Settings/hooks/useProfileSettings'
import { usePasswordSettings } from '@/app/pages/Settings/hooks/usePasswordSettings'

export function useSettingsPageController() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const theme = useSettingsThemeTokens()
  const profile = useProfileSettings()
  const password = usePasswordSettings()

  const onLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return { theme, profile, password, onLogout }
}
