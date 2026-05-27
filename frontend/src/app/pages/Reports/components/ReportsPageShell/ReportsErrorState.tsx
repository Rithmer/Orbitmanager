import { PageShellQueryError } from '@/app/components/PageShell'
import type { ReportsErrorStateProps } from '@/app/pages/Reports/types'

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
