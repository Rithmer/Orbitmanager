import type { CalItem } from './calendar'

export type CalendarGridCell = {
  year: number
  month: number
  day: number
  inCurrentMonth: boolean
  isNextMonth: boolean
}

export type CalendarGridProps = {
  cells: CalendarGridCell[]
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
