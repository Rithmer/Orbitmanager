import { PageShellQueryError } from '@/app/components/PageShell'
import type { DashboardErrorStateProps } from '@/app/pages/Dashboard/types'

export function DashboardErrorState({
  firstName,
  errorMessage,
  textSecondary,
  onRetry,
}: DashboardErrorStateProps) {
  return (
    <PageShellQueryError
      title={`Добро пожаловать, ${firstName}!`}
      description="Не удалось загрузить сводку."
      errorMessage={errorMessage}
      textSecondary={textSecondary}
      onRetry={onRetry}
    />
  )
}
