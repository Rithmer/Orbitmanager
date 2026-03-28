import type { CalendarUiTokens } from '@/app/pages/Calendar/types/calendar-ui-tokens'

export type CalendarHeaderProps = {
  ui: CalendarUiTokens
  title: string
  subtitle: string
  canManageCalendar: boolean
  onPrevMonth: () => void
  onNextMonth: () => void
  onCreateEvent: () => void
}
