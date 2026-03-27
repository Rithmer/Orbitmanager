import { PageShellQueryError } from '@/app/components/PageShell'

export type ReportsErrorStateProps = {
  errorMessage: string
  textSecondary: string
  onRetry: () => void
}

export function ReportsErrorState({ errorMessage, textSecondary, onRetry }: ReportsErrorStateProps) {
  return (
    <PageShellQueryError
      title="Аналитика"
      description="Не удалось загрузить данные аналитики."
      errorMessage={errorMessage}
      textSecondary={textSecondary}
      onRetry={onRetry}
    />
  )
}
