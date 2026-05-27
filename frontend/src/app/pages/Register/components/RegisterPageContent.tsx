import { useTheme } from '@/app/context/useTheme'
import { useAuthCardSurfaceTokens } from '@/app/hooks/useAuthCardSurfaceTokens'
import { useRegisterForm } from '@/app/pages/Register/hooks/useRegisterForm'
import { RegisterPageView } from '@/app/pages/Register/components/RegisterPageView'

export function RegisterPageContent() {
  const { isDark } = useTheme()
  const tokens = useAuthCardSurfaceTokens(isDark)
  const register = useRegisterForm()

  return <RegisterPageView model={{ tokens, ...register }} />
}
