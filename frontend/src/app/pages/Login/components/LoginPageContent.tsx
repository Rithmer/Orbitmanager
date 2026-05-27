import { useTheme } from '@/app/context/useTheme'
import { useAuthCardSurfaceTokens } from '@/app/hooks/useAuthCardSurfaceTokens'
import { useLoginForm } from '@/app/pages/Login/hooks/useLoginForm'
import { LoginPageView } from '@/app/pages/Login/components/LoginPageView'

export function LoginPageContent() {
  const { isDark } = useTheme()
  const tokens = useAuthCardSurfaceTokens(isDark)
  const login = useLoginForm()

  return <LoginPageView model={{ tokens, ...login }} />
}
