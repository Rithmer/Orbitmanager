import type { CalItem } from './calendar'
import type { CalendarUiTokens } from '@/app/pages/Calendar/types/calendar-ui-tokens'

export type CalendarGridCell = {
  year: number
  month: number
  day: number
  inCurrentMonth: boolean
  isNextMonth: boolean
}

export type CalendarGridProps = {
  ui: CalendarUiTokens
  cells: CalendarGridCell[]
  getItemsForDate: (year: number, month: number, day: number) => CalItem[]
  getEventColorById: (eventId: number | undefined) => string
  isToday: (year: number, month: number, day: number) => boolean
  onSelectDay: (day: number) => void
}
