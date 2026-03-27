import { PageShellQueryError } from '@/app/components/PageShell'

export type DashboardErrorStateProps = {
  firstName: string
  errorMessage: string
  textSecondary: string
  onRetry: () => void
}

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
