import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Plus,
  Tag,
  Trash2,
  Edit3,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'
import { useTheme } from '../context/useTheme'
import { calendarApi } from '../api/calendar'
import { AccountRole, TASK_STATUS_LABELS, TaskStatus } from '../types'
import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../components/Modal'
import { PageShell } from '../components/PageShell'
import {
  formatLocalDateInput,
  formatLocalTimeInput,
  toLocalDateTimeIso,
  toLocalEndOfDayIso,
} from '../utils/dateTime'
import {
  CalendarMonthViewSkeleton,
} from '../features/calendar/calendar-view'
import { DAY_NAMES, MONTH_NAMES, buildMonthCells, getLocalMonthTitle } from '../features/calendar/calendar-view.constants'
import {
  useCalendarMonthViewQuery,
  type CalendarMonthView,
  type CalendarViewEvent,
} from '../features/calendar'

type CalendarFilter = 'all' | 'tasks' | 'events'

interface CalendarDayEntry {
  id: string
  type: 'task' | 'event'
  title: string
  description: string
  projectName: string | null
  time: string
  duration?: string
  status?: TaskStatus
  eventId?: number
  accentColor?: string
  backgroundClass: string
  textClass: string
  sortTimestamp: number
}

const EVENT_COLOR_OPTIONS = [
  { label: 'Синий', value: '#3b82f6' },
  { label: 'Фиолетовый', value: '#8b5cf6' },
  { label: 'Зелёный', value: '#10b981' },
  { label: 'Жёлтый', value: '#f59e0b' },
  { label: 'Красный', value: '#ef4444' },
]

const EVENT_DURATION_OPTIONS = [
  { label: '30 минут', value: '30' },
  { label: '1 час', value: '60' },
  { label: '2 часа', value: '120' },
  { label: '4 часа', value: '240' },
]

const TASK_STATUS_STYLES: Record<TaskStatus, { backgroundClass: string; textClass: string }> = {
  [TaskStatus.NEW]: { backgroundClass: 'bg-blue-50 dark:bg-blue-500/10', textClass: 'text-[#4880ff]' },
  [TaskStatus.IN_PROGRESS]: { backgroundClass: 'bg-amber-50 dark:bg-amber-500/10', textClass: 'text-amber-500' },
  [TaskStatus.REVIEW]: { backgroundClass: 'bg-violet-50 dark:bg-violet-500/10', textClass: 'text-violet-500' },
  [TaskStatus.DONE]: { backgroundClass: 'bg-emerald-50 dark:bg-emerald-500/10', textClass: 'text-emerald-500' },
  [TaskStatus.CANCELLED]: { backgroundClass: 'bg-red-50 dark:bg-red-500/10', textClass: 'text-red-500' },
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toLocalDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

function getTimeLabel(value: string): string {
  const date = new Date(value)
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function formatDurationLabel(minutes: number): string {
  if (minutes <= 0) return '0 мин'
  if (minutes < 60) return `${minutes} мин`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes === 0 ? `${hours} ч` : `${hours} ч ${remainingMinutes} мин`
}

function getEventDurationMinutes(event: CalendarViewEvent): number {
  const start = new Date(event.startDate).getTime()
  const end = new Date(event.endDate).getTime()
  return Math.max(0, Math.round((end - start) / 60000))
}

function buildCalendarDayEntries(
  calendarMonthView: CalendarMonthView,
  selectedDay: number | null,
  filterType: CalendarFilter = 'all',
): CalendarDayEntry[] {
  if (selectedDay === null) {
    return []
  }

  const selectedDateKey = toLocalDateKey(
    new Date(calendarMonthView.year, calendarMonthView.month - 1, selectedDay),
  )

  const taskEntries = calendarMonthView.tasks
    .filter((task) => filterType !== 'events' && toLocalDateKey(task.deadline) === selectedDateKey)
    .map<CalendarDayEntry>((task) => {
      const statusStyles = TASK_STATUS_STYLES[task.status as TaskStatus]
      return {
        id: `task-${task.id}`,
        type: 'task',
        title: task.name,
        description: task.description,
        projectName: task.projectName,
        time: `Дедлайн: ${new Date(task.deadline).toLocaleDateString('ru-RU')}`,
        status: task.status as TaskStatus,
        backgroundClass: statusStyles.backgroundClass,
        textClass: statusStyles.textClass,
        sortTimestamp: new Date(task.deadline).getTime(),
      }
    })

  const eventEntries = calendarMonthView.events
    .filter((event) => filterType !== 'tasks' && toLocalDateKey(event.startDate) === selectedDateKey)
    .map<CalendarDayEntry>((event) => ({
      id: `event-${event.id}`,
      type: 'event',
      title: event.title,
      description: event.description,
      projectName: event.projectName,
      time: event.allDay ? 'Весь день' : getTimeLabel(event.startDate),
      duration: event.allDay ? undefined : formatDurationLabel(getEventDurationMinutes(event)),
      eventId: event.id,
      accentColor: event.color,
      backgroundClass: 'bg-[#4880ff]',
      textClass: 'text-white',
      sortTimestamp: new Date(event.startDate).getTime(),
    }))

  return [...taskEntries, ...eventEntries].sort((left, right) => left.sortTimestamp - right.sortTimestamp)
}

function buildMonthDayItems(calendarMonthView: CalendarMonthView) {
  const dayItems = new Map<number, CalendarDayEntry[]>()

  for (const task of calendarMonthView.tasks) {
    const taskDate = new Date(task.deadline)
    if (
      taskDate.getFullYear() !== calendarMonthView.year ||
      taskDate.getMonth() + 1 !== calendarMonthView.month
    ) {
      continue
    }

    const statusStyles = TASK_STATUS_STYLES[task.status as TaskStatus]
    const bucket = dayItems.get(taskDate.getDate()) ?? []
    bucket.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.name,
      description: task.description,
      projectName: task.projectName,
      time: `Дедлайн: ${taskDate.toLocaleDateString('ru-RU')}`,
      status: task.status as TaskStatus,
      backgroundClass: statusStyles.backgroundClass,
      textClass: statusStyles.textClass,
      sortTimestamp: taskDate.getTime(),
    })
    dayItems.set(taskDate.getDate(), bucket)
  }

  for (const event of calendarMonthView.events) {
    const eventDate = new Date(event.startDate)
    if (
      eventDate.getFullYear() !== calendarMonthView.year ||
      eventDate.getMonth() + 1 !== calendarMonthView.month
    ) {
      continue
    }

    const bucket = dayItems.get(eventDate.getDate()) ?? []
    bucket.push({
      id: `event-${event.id}`,
      type: 'event',
      title: event.title,
      description: event.description,
      projectName: event.projectName,
      time: event.allDay ? 'Весь день' : getTimeLabel(event.startDate),
      duration: event.allDay ? undefined : formatDurationLabel(getEventDurationMinutes(event)),
      eventId: event.id,
      accentColor: event.color,
      backgroundClass: 'bg-[#4880ff]',
      textClass: 'text-white',
      sortTimestamp: eventDate.getTime(),
    })
    dayItems.set(eventDate.getDate(), bucket)
  }

  return dayItems
}

export function Calendar() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const today = new Date()

  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<CalendarFilter>('all')
  const [isEventFormOpen, setIsEventFormOpen] = useState(false)
  const [selectedEventForEditing, setSelectedEventForEditing] = useState<CalendarViewEvent | null>(null)
  const [eventFormError, setEventFormError] = useState('')
  const [eventFormTitle, setEventFormTitle] = useState('')
  const [eventFormDescription, setEventFormDescription] = useState('')
  const [eventFormDate, setEventFormDate] = useState(formatLocalDateInput(today))
  const [eventFormTime, setEventFormTime] = useState('09:00')
  const [eventFormDurationMinutes, setEventFormDurationMinutes] = useState('60')
  const [eventFormProjectId, setEventFormProjectId] = useState('')
  const [eventFormColor, setEventFormColor] = useState('#3b82f6')
  const [eventFormAllDay, setEventFormAllDay] = useState(false)

  const canManageCalendar =
    user?.accountRole === AccountRole.ADMIN || user?.accountRole === AccountRole.MEMBER

  const calendarQuery = useCalendarMonthViewQuery({
    year: currentYear,
    month: currentMonth,
  })
  const calendarMonthView = calendarQuery.data ?? null
  const viewYear = calendarMonthView?.year ?? currentYear
  const viewMonth = calendarMonthView?.month ?? currentMonth
  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const dayCellBorder = isDark ? 'border-[#313d4f]' : 'border-gray-200'
  const dayCellHover = isDark ? 'hover:bg-[#273142]' : 'hover:bg-gray-50'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  const invalidateCalendar = async () => {
    await queryClient.invalidateQueries({
      queryKey: ['calendar', 'month-view'],
    })
  }

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const startDate = eventFormAllDay
        ? toLocalDateTimeIso(eventFormDate, '00:00')
        : toLocalDateTimeIso(eventFormDate, eventFormTime)
      const endDate = eventFormAllDay
        ? toLocalEndOfDayIso(eventFormDate)
        : new Date(
            new Date(startDate).getTime() + Number(eventFormDurationMinutes) * 60_000,
          ).toISOString()

      return calendarApi.create({
        title: eventFormTitle.trim(),
        description: eventFormDescription.trim() || undefined,
        startDate,
        endDate,
        allDay: eventFormAllDay,
        color: eventFormColor,
        projectId: eventFormProjectId ? Number(eventFormProjectId) : undefined,
      })
    },
    onSuccess: async () => {
      setIsEventFormOpen(false)
      resetEventForm()
      await invalidateCalendar()
    },
    onError: (error) => {
      setEventFormError(error instanceof Error ? error.message : 'Ошибка создания события')
    },
  })

  const updateEventMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEventForEditing) {
        throw new Error('Событие не выбрано')
      }

      const startDate = eventFormAllDay
        ? toLocalDateTimeIso(eventFormDate, '00:00')
        : toLocalDateTimeIso(eventFormDate, eventFormTime)
      const endDate = eventFormAllDay
        ? toLocalEndOfDayIso(eventFormDate)
        : new Date(
            new Date(startDate).getTime() + Number(eventFormDurationMinutes) * 60_000,
          ).toISOString()

      return calendarApi.update(selectedEventForEditing.id, {
        title: eventFormTitle.trim(),
        description: eventFormDescription.trim(),
        startDate,
        endDate,
        allDay: eventFormAllDay,
        color: eventFormColor,
        projectId: eventFormProjectId ? Number(eventFormProjectId) : null,
      })
    },
    onSuccess: async () => {
      setIsEventFormOpen(false)
      setSelectedEventForEditing(null)
      resetEventForm()
      await invalidateCalendar()
    },
    onError: (error) => {
      setEventFormError(error instanceof Error ? error.message : 'Ошибка обновления события')
    },
  })

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => calendarApi.delete(eventId),
    onSuccess: async () => {
      await invalidateCalendar()
    },
  })

  if (calendarQuery.isLoading && !calendarMonthView) {
    return (
      <PageShell title="Календарь" description="Загрузка календарной сетки..." className={pageBg}>
        <CalendarMonthViewSkeleton />
      </PageShell>
    )
  }

  if (calendarQuery.isError && !calendarMonthView) {
    return (
      <PageShell
        title="Календарь"
        description="Не удалось загрузить календарь."
        className={pageBg}
        actions={
          <button
            onClick={() => calendarQuery.refetch()}
            className="rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
          >
            Повторить
          </button>
        }
      >
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-black/10 bg-white/60 p-10 text-center dark:border-white/10 dark:bg-[#273142]">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className={`text-lg font-bold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`max-w-xl text-sm ${textSecondary}`}>
            {calendarQuery.error instanceof Error
              ? calendarQuery.error.message
              : 'Не удалось загрузить данные календаря. Попробуйте повторить запрос.'}
          </p>
        </div>
      </PageShell>
    )
  }

  if (!calendarMonthView) {
    return null
  }

  const monthCells = buildMonthCells(viewYear, viewMonth)
  const refreshLabel = calendarQuery.isFetching && !calendarQuery.isLoading
  const monthDayItems = buildMonthDayItems(calendarMonthView)
  const selectedDayEntries = buildCalendarDayEntries(calendarMonthView, selectedDay, filterType)
  const filterButtons: Array<{ key: CalendarFilter; label: string }> = [
    { key: 'all', label: 'Все' },
    { key: 'tasks', label: 'Задачи' },
    { key: 'events', label: 'События' },
  ]

  function resetEventForm() {
    setEventFormError('')
    setEventFormTitle('')
    setEventFormDescription('')
    setEventFormDate(formatLocalDateInput(today))
    setEventFormTime('09:00')
    setEventFormDurationMinutes('60')
    setEventFormProjectId('')
    setEventFormColor('#3b82f6')
    setEventFormAllDay(false)
  }

  function openEventCreation(day?: number) {
    setSelectedEventForEditing(null)
    resetEventForm()
    const maxDay = new Date(viewYear, viewMonth, 0).getDate()
    const targetDay = Math.min(day ?? selectedDay ?? today.getDate(), maxDay)
    const targetDate = new Date(viewYear, viewMonth - 1, targetDay)
    setEventFormDate(formatLocalDateInput(targetDate))
    setIsEventFormOpen(true)
  }

  function openEventEditing(event: CalendarViewEvent) {
    setSelectedEventForEditing(event)
    setEventFormError('')
    setEventFormTitle(event.title)
    setEventFormDescription(event.description)
    setEventFormDate(formatLocalDateInput(event.startDate))
    setEventFormTime(formatLocalTimeInput(event.startDate))
    setEventFormDurationMinutes(String(Math.max(30, getEventDurationMinutes(event) || 60)))
    setEventFormProjectId(event.projectId ? String(event.projectId) : '')
    setEventFormColor(event.color)
    setEventFormAllDay(event.allDay)
    setIsEventFormOpen(true)
  }

  const goToPreviousMonth = () => {
    setSelectedDay(null)
    if (currentMonth === 1) {
      setCurrentYear((year) => year - 1)
      setCurrentMonth(12)
      return
    }

    setCurrentMonth((month) => month - 1)
  }

  const goToNextMonth = () => {
    setSelectedDay(null)
    if (currentMonth === 12) {
      setCurrentYear((year) => year + 1)
      setCurrentMonth(1)
      return
    }

    setCurrentMonth((month) => month + 1)
  }

  return (
    <PageShell
      title={getLocalMonthTitle(viewYear, viewMonth)}
      description="Дедлайны задач и события в календаре"
      className={pageBg}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={goToPreviousMonth}
            className={`rounded-lg border px-3 py-2 transition-colors ${
              isDark
                ? 'border-[#313d4f] text-[#f4f3f2] hover:bg-[#273142]'
                : 'border-gray-200 text-[#202224] hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className={`rounded-lg border px-3 py-2 transition-colors ${
              isDark
                ? 'border-[#313d4f] text-[#f4f3f2] hover:bg-[#273142]'
                : 'border-gray-200 text-[#202224] hover:bg-gray-50'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          {canManageCalendar && (
            <button
              onClick={() => openEventCreation()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
            >
              <Plus className="h-4 w-4" />
              Событие
            </button>
          )}
        </div>
      }
    >
      {refreshLabel && (
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${isDark ? 'bg-[#273142] text-[#94a3b8]' : 'bg-white text-[#737373] shadow-sm'}`}>
          <span className="h-2 w-2 rounded-full bg-[#4880ff]" />
          Обновление календарной сетки
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Filter className={`h-4 w-4 ${textSecondary}`} />
        {filterButtons.map((button) => (
          <button
            key={button.key}
            onClick={() => setFilterType(button.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              filterType === button.key
                ? 'bg-[#4880ff] text-white'
                : isDark
                  ? 'bg-[#273142] text-[#94a3b8] hover:text-white'
                  : 'border border-gray-200 bg-white text-gray-500 hover:text-gray-700'
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className={`${cardBg} overflow-hidden rounded-xl border ${cardBorder}`}>
        <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/5">
          {DAY_NAMES.map((dayName) => (
            <div
              key={dayName}
              className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${textSecondary}`}
            >
              {dayName}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthCells.map((cell, index) => {
            if (cell.type === 'empty') {
              return (
                <div
                  key={`empty-${index}`}
                  className={`min-h-[92px] border-t border-r p-2 md:min-h-[120px] ${dayCellBorder} ${
                    index % 7 === 6 ? 'border-r-0' : ''
                  }`}
                />
              )
            }

            const items = monthDayItems.get(cell.day) ?? []
            const visibleItems = items.filter((entry) => {
              if (filterType === 'tasks') return entry.type === 'task'
              if (filterType === 'events') return entry.type === 'event'
              return true
            })
            const isToday =
              cell.day === today.getDate() &&
              viewMonth === today.getMonth() + 1 &&
              viewYear === today.getFullYear()

            return (
              <button
                key={`day-${cell.day}`}
                type="button"
                onClick={() => setSelectedDay(cell.day)}
                className={`min-h-[92px] border-t border-r p-2 text-left transition-colors md:min-h-[120px] ${dayCellBorder} ${dayCellHover} ${
                  index % 7 === 6 ? 'border-r-0' : ''
                } ${isToday ? (isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50/60') : ''}`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold md:h-7 md:w-7 ${
                      isToday ? 'bg-[#4880ff] text-white' : textPrimary
                    }`}
                  >
                    {cell.day}
                  </span>
                </div>
                <div className="space-y-1">
                  {visibleItems.slice(0, 2).map((entry) => (
                    <div
                      key={entry.id}
                      className={`truncate rounded px-1.5 py-0.5 text-[10px] font-semibold ${entry.backgroundClass} ${entry.textClass}`}
                      style={entry.type === 'event' ? { backgroundColor: entry.accentColor ?? '#4880ff' } : undefined}
                    >
                      {entry.type === 'event' && <span className="mr-0.5">●</span>}
                      {entry.title}
                    </div>
                  ))}
                  {visibleItems.length > 2 && (
                    <div className={`text-[10px] font-semibold ${textSecondary}`}>+{visibleItems.length - 2} ещё</div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <Modal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? `${selectedDay} ${MONTH_NAMES[viewMonth - 1]}` : 'День календаря'}
        maxWidth="max-w-2xl"
      >
        {selectedDay !== null ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={`text-sm font-semibold ${textPrimary}`}>
                  {selectedDay} {MONTH_NAMES[viewMonth - 1]}
                </p>
                <p className={`text-xs ${textSecondary}`}>{viewYear}</p>
              </div>
              {canManageCalendar && (
                <button
                  onClick={() => openEventCreation(selectedDay)}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#4880ff] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
                >
                  <Plus className="h-4 w-4" />
                  Событие
                </button>
              )}
            </div>

            {selectedDayEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <div className={`flex h-14 w-14 items-center justify-center rounded-full ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                  <Clock className={`h-6 w-6 ${textSecondary}`} />
                </div>
                <p className={`text-sm font-semibold ${textSecondary}`}>Нет событий</p>
                <p className={`text-xs ${textSecondary}`}>В этот день нет задач и календарных записей.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex gap-3 rounded-xl p-3 md:p-4 ${entry.type === 'event' ? 'text-white' : isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}
                      style={entry.type === 'event' ? { backgroundColor: entry.accentColor ?? '#4880ff' } : undefined}
                    >
                      <div
                        className={`w-1 shrink-0 rounded-full ${entry.type === 'task' ? entry.backgroundClass : ''}`}
                        style={entry.type === 'event' ? { backgroundColor: '#ffffff' } : undefined}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-1.5">
                            {entry.type === 'event' && <CalendarDays className="h-3 w-3 shrink-0 text-white" />}
                            {entry.type === 'task' && <Tag className={`h-3 w-3 shrink-0 ${entry.textClass}`} />}
                            <p className={`truncate text-sm font-semibold ${entry.type === 'event' ? 'text-white' : textPrimary}`}>
                              {entry.title}
                            </p>
                          </div>
                          {entry.type === 'task' && entry.status && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${entry.backgroundClass} ${entry.textClass}`}>
                              {TASK_STATUS_LABELS[entry.status]}
                            </span>
                          )}
                        </div>
                        {entry.description && (
                          <p className={`mb-1 text-xs ${entry.type === 'event' ? 'text-white/90' : textSecondary}`}>
                            {entry.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`text-xs ${entry.type === 'event' ? 'text-white/90' : textSecondary}`}>{entry.time}</span>
                          {entry.duration && (
                            <span className={`text-xs ${entry.type === 'event' ? 'text-white/90' : textSecondary}`}>{entry.duration}</span>
                          )}
                          {entry.projectName && (
                            <span className={`text-xs ${entry.type === 'event' ? 'text-white/90' : textSecondary}`}>{entry.projectName}</span>
                          )}
                          {entry.type === 'event' && <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold text-white">Событие</span>}
                        </div>
                        {entry.type === 'event' && canManageCalendar && entry.eventId && (
                          <div className="mt-2 flex items-center gap-1">
                            <button
                              onClick={() => {
                                const event = calendarMonthView.events.find((candidate) => candidate.id === entry.eventId)
                                if (event) {
                                  openEventEditing(event)
                                }
                              }}
                              className="rounded p-1 text-white/90 transition-colors hover:bg-white/10"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (entry.eventId) {
                                  deleteEventMutation.mutate(entry.eventId)
                                }
                              }}
                              className="rounded p-1 text-white/90 transition-colors hover:bg-white/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isEventFormOpen}
        onClose={() => {
          setIsEventFormOpen(false)
          setSelectedEventForEditing(null)
          resetEventForm()
        }}
        title={selectedEventForEditing ? 'Редактировать событие' : 'Новое событие'}
        maxWidth="max-w-xl"
      >
        <ErrorMessage message={eventFormError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            if (selectedEventForEditing) {
              void updateEventMutation.mutateAsync()
              return
            }

            void createEventMutation.mutateAsync()
          }}
          className="space-y-4"
        >
          <InputField
            label="Название"
            value={eventFormTitle}
            onChange={setEventFormTitle}
            required
            placeholder="Название события"
          />
          <InputField
            label="Описание"
            value={eventFormDescription}
            onChange={setEventFormDescription}
            placeholder="Описание события"
          />
          <InputField label="Дата" value={eventFormDate} onChange={setEventFormDate} type="date" required />
          <InputField
            label="Время начала"
            value={eventFormTime}
            onChange={setEventFormTime}
            type="time"
            required={!eventFormAllDay}
            disabled={eventFormAllDay}
          />
          <SelectField
            label="Длительность"
            value={eventFormDurationMinutes}
            onChange={setEventFormDurationMinutes}
            options={EVENT_DURATION_OPTIONS}
            disabled={eventFormAllDay}
          />
          <SelectField
            label="Проект"
            value={eventFormProjectId}
            onChange={setEventFormProjectId}
            options={[
              { value: '', label: 'Без проекта' },
              ...calendarMonthView.projects.map((project) => ({ value: String(project.id), label: project.name })),
            ]}
          />
          <div>
            <label className={`mb-1.5 block text-sm font-semibold ${isDark ? 'text-[#94a3b8]' : 'text-[#737373]'}`}>
              Цвет
            </label>
            <div className="flex flex-wrap gap-2">
              {EVENT_COLOR_OPTIONS.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => setEventFormColor(colorOption.value)}
                  className={`h-8 w-8 rounded-full transition-all ${eventFormColor === colorOption.value ? 'ring-2 ring-[#4880ff] ring-offset-2' : ''}`}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.label}
                />
              ))}
            </div>
          </div>
          <label className={`flex items-center gap-2 text-sm ${textPrimary}`}>
            <input
              type="checkbox"
              checked={eventFormAllDay}
              onChange={(event) => setEventFormAllDay(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#4880ff] focus:ring-[#4880ff]"
            />
            Весь день
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsEventFormOpen(false)
                setSelectedEventForEditing(null)
                resetEventForm()
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${textSecondary}`}
            >
              Отмена
            </button>
            <SubmitButton loading={createEventMutation.isPending || updateEventMutation.isPending}>
              {selectedEventForEditing ? 'Сохранить' : 'Создать'}
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </PageShell>
  )
}
