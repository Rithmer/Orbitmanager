export type CalendarHeaderProps = {
  title: string
  subtitle: string
  isDark: boolean
  textPrimary: string
  textSecondary: string
  canManageCalendar: boolean
  onPrevMonth: () => void
  onNextMonth: () => void
  onCreateEvent: () => void
}
