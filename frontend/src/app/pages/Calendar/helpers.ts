import type { CalendarEvent, Project, Task } from '@/app/types'
import { TaskStatus } from '@/app/types'
import { CALENDAR_PAGE_CONSTANTS } from '@/app/pages/Calendar/constants'
import type { CalItem, EventFilterType } from '@/app/pages/Calendar/types'

export function getCalendarFallbackErrorMessage(source: 'projects' | 'events' | 'tasks'): string {
  if (source === 'projects') return 'Список проектов временно недоступен. Доступны задачи и события.'
  if (source === 'tasks') return 'Список задач временно недоступен. Доступны проекты и события.'
  return 'Список событий временно недоступен. Проверьте соединение и попробуйте снова.'
}

export function formatDuration(startDate: string, endDate: string): string {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} мин`
  const hrs = Math.floor(mins / 60)
  const remainMins = mins % 60
  return remainMins === 0 ? `${hrs} ч` : `${hrs} ч ${remainMins} мин`
}

export function getFirstDayOfMonth(year: number, month: number) {
  const sundayFirst = new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
  return (sundayFirst + 6) % 7
}

export function toLocalDateStr(isoString: string): string {
  const d = new Date(isoString)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getProjectName(projects: Project[], projectId: number | null): string {
  if (!projectId) return ''
  return projects.find((p) => p.id === projectId)?.name || ''
}

export function getItemsForDate(
  year: number,
  month: number,
  day: number,
  filterType: EventFilterType,
  tasks: Task[],
  events: CalendarEvent[],
  projects: Project[],
): CalItem[] {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const items: CalItem[] = []

  if (filterType === 'all' || filterType === 'tasks') {
    tasks
      .filter((t) => t.deadline && toLocalDateStr(t.deadline) === dateStr)
      .forEach((t) => {
        const sc = CALENDAR_PAGE_CONSTANTS.STATUS_COLORS[t.status as TaskStatus] || CALENDAR_PAGE_CONSTANTS.STATUS_COLORS[TaskStatus.NEW]
        items.push({
          id: `task-${t.id}`,
          type: 'task',
          taskId: t.id,
          title: t.name,
          color: sc.bg,
          textColor: sc.text,
          time: new Date(t.deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          description: t.description,
          status: t.status,
          projectName: getProjectName(projects, t.projectId),
        })
      })
  }

  if (filterType === 'all' || filterType === 'events') {
    events
      .filter((e) => toLocalDateStr(e.startDate) === dateStr)
      .forEach((e) => {
        items.push({
          id: `event-${e.id}`,
          type: 'event',
          eventId: e.id,
          title: e.title,
          color: '',
          textColor: 'text-white',
          time: new Date(e.startDate).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          duration: formatDuration(e.startDate, e.endDate),
          description: e.description,
          projectName: getProjectName(projects, e.projectId),
        })
      })
  }

  return items.sort((a, b) => a.time.localeCompare(b.time))
}

export function buildCalendarCells(currentYear: number, currentMonth: number) {
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)
  const nextMonthDate = new Date(currentYear, currentMonth, 1)
  const nextMonthNumber = nextMonthDate.getMonth() + 1
  const nextYear = nextMonthDate.getFullYear()
  const daysInMonth = new Date(Date.UTC(currentYear, currentMonth, 0)).getUTCDate()
  const occupiedCells = firstDayOfMonth + daysInMonth
  let weekCount = Math.ceil(occupiedCells / 7)
  if (daysInMonth === 28) weekCount += 1
  const totalCells = weekCount * 7
  const gridStartDate = new Date(currentYear, currentMonth - 1, 1 - firstDayOfMonth)

  return Array.from({ length: totalCells }, (_, i) => {
    const date = new Date(gridStartDate.getFullYear(), gridStartDate.getMonth(), gridStartDate.getDate() + i)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    return {
      year,
      month,
      day: date.getDate(),
      inCurrentMonth: year === currentYear && month === currentMonth,
      isNextMonth: year === nextYear && month === nextMonthNumber,
    }
  })
}
