import { CALENDAR_PAGE_CONSTANTS } from '@/app/pages/Calendar/constants'
import type { CalItem } from '@/app/pages/Calendar/types'

type Cell = {
  year: number
  month: number
  day: number
  inCurrentMonth: boolean
  isNextMonth: boolean
}

type CalendarGridProps = {
  cells: Cell[]
  cardBg: string
  cardBorder: string
  dayHeaderBg: string
  dayCellBorder: string
  dayCellHover: string
  textPrimary: string
  textSecondary: string
  isDark: boolean
  getItemsForDate: (year: number, month: number, day: number) => CalItem[]
  getEventColorById: (eventId: number | undefined) => string
  isToday: (year: number, month: number, day: number) => boolean
  onSelectDay: (day: number) => void
}

export function CalendarGrid({
  cells,
  cardBg,
  cardBorder,
  dayHeaderBg,
  dayCellBorder,
  dayCellHover,
  textPrimary,
  textSecondary,
  isDark,
  getItemsForDate,
  getEventColorById,
  isToday,
  onSelectDay,
}: CalendarGridProps) {
  return (
    <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className={`grid grid-cols-7 ${dayHeaderBg}`}>
            {CALENDAR_PAGE_CONSTANTS.DAYS_OF_WEEK.map((d) => (
              <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${textSecondary}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, idx) => {
              const { year, month, day, inCurrentMonth, isNextMonth } = cell
              const dayItems = getItemsForDate(year, month, day)
              const todayCell = isToday(year, month, day)
              const colIdx = idx % 7
              const mutedOpacity = inCurrentMonth ? '' : isNextMonth ? 'opacity-40' : 'opacity-25'
              const clickable = inCurrentMonth

              return (
                <div
                  key={`day-${year}-${month}-${day}`}
                  onClick={clickable ? () => onSelectDay(day) : undefined}
                  className={`border-t border-r ${dayCellBorder} min-h-[80px] md:min-h-[110px] p-1.5 md:p-2 transition-colors ${
                    colIdx === 6 ? 'border-r-0' : ''
                  } ${clickable ? dayCellHover : ''} ${
                    todayCell ? (isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50/60') : ''
                  } ${mutedOpacity} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${todayCell ? 'bg-[#4880ff] text-white' : inCurrentMonth ? textPrimary : textSecondary}`}>
                      {day}
                    </span>
                  </div>
                  <div className="space-y-0.5 md:space-y-1">
                    {dayItems.slice(0, 2).map((item) => (
                      <div
                        key={item.id}
                        className={`text-[9px] md:text-[10px] font-semibold px-1 md:px-1.5 py-0.5 rounded truncate ${item.type === 'task' ? `${item.color} ${item.textColor}` : 'text-white'}`}
                        style={item.type === 'event' ? { backgroundColor: getEventColorById(item.eventId) } : undefined}
                      >
                        {item.type === 'event' ? <span className="mr-0.5">&#9679;</span> : null}
                        {item.title}
                      </div>
                    ))}
                    {dayItems.length > 2 ? (
                      <div className={`text-[9px] md:text-[10px] font-semibold ${textSecondary}`}>+{dayItems.length - 2} ещё</div>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
