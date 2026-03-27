import { AlertCircle } from 'lucide-react'
import { PageSection } from '@/app/components/PageShell'

type RisksErrorStateProps = {
  isMlDown: boolean
  textSecondary: string
  errorMessage: string
  onRetry: () => void
}

export function RisksErrorState({ isMlDown, textSecondary, errorMessage, onRetry }: RisksErrorStateProps) {
  return (
    <PageSection title={isMlDown ? 'ML-сервис недоступен' : 'Ошибка загрузки'}>
      <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
        <AlertCircle className={`w-10 h-10 ${isMlDown ? 'text-amber-500' : 'text-red-500'}`} />
        <p className={`text-sm ${textSecondary} max-w-md`}>{errorMessage}</p>
        <button
          onClick={onRetry}
          className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Повторить
        </button>
      </div>
    </PageSection>
  )
}
