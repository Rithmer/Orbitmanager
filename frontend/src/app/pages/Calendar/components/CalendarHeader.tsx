import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { CalendarHeaderProps } from '@/app/pages/Calendar/types'

export function CalendarHeader({
  title,
  subtitle,
  isDark,
  textPrimary,
  textSecondary,
  canManageCalendar,
  onPrevMonth,
  onNextMonth,
  onCreateEvent,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 page-load-stagger">
      <div>
        <h1 className={`text-2xl font-bold ${textPrimary}`}>{title}</h1>
        <p className={`mt-1 text-sm ${textSecondary}`}>{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button onClick={onPrevMonth} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#f4f3f2] hover:bg-[#273142]' : 'text-[#202224] hover:bg-gray-100'}`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={onNextMonth} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#f4f3f2] hover:bg-[#273142]' : 'text-[#202224] hover:bg-gray-100'}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {canManageCalendar ? (
          <button onClick={onCreateEvent} className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 btn-fizzy">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Событие</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}
