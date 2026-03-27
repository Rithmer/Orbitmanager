import { AlertCircle, RefreshCw } from 'lucide-react'
import { PageSection, PageShell } from '@/app/components/page-shell/page-shell-core'

export type PageShellQueryErrorProps = {
  title: string
  description: string
  errorMessage: string
  textSecondary: string
  onRetry: () => void
  sectionTitle?: string
}

export function PageShellQueryError({
  title,
  description,
  errorMessage,
  textSecondary,
  onRetry,
  sectionTitle = 'Ошибка загрузки',
}: PageShellQueryErrorProps) {
  return (
    <PageShell
      title={title}
      description={description}
      actions={
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Повторить
        </button>
      }
    >
      <PageSection title={sectionTitle}>
        <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className={`text-sm ${textSecondary} max-w-md`}>{errorMessage}</p>
        </div>
      </PageSection>
    </PageShell>
  )
}
