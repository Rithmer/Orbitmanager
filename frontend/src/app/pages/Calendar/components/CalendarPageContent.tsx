import { useCalendarPageController } from '@/app/pages/Calendar/hooks/useCalendarPageController'
import { CalendarPageView } from '@/app/pages/Calendar/components/CalendarPageView'

export function CalendarPageContent() {
  const model = useCalendarPageController()
  return <CalendarPageView model={model} />
}
