import { CalendarDays } from 'lucide-react'
import type { CalendarSurfaceTokens } from '@/app/pages/Calendar/types/calendar-ui-tokens'

type CalendarPageErrorStateProps = {
  tokens: CalendarSurfaceTokens
  error: string
  onRetry: () => void
}

export function CalendarPageErrorState({ tokens, error, onRetry }: CalendarPageErrorStateProps) {
  return (
    <div className={`${tokens.pageBg} min-h-full p-8`}>
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <CalendarDays className="w-10 h-10 text-red-500" />
        <p className={`text-lg font-bold ${tokens.textPrimary}`}>Ошибка загрузки</p>
        <p className={`text-sm ${tokens.textSecondary} text-center max-w-md`}>{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
        >
          Повторить
        </button>
      </div>
    </div>
  )
}
