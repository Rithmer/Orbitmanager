import { useMemo, useState } from 'react'
import { useAuth } from '@/app/context/useAuth'
import { useTheme } from '@/app/context/useTheme'
import { AccountRole, type CalendarEvent } from '@/app/types'
import { CALENDAR_PAGE_CONSTANTS } from '@/app/pages/Calendar/constants'
import { buildCalendarCells, getItemsForDate } from '@/app/pages/Calendar/helpers'
import { useCalendarData } from '@/app/pages/Calendar/hooks/useCalendarData'
import { useCalendarEventForm } from '@/app/pages/Calendar/hooks/useCalendarEventForm'
import { useCalendarThemeTokens } from '@/app/pages/Calendar/hooks/useCalendarThemeTokens'
import type { CalendarPageViewModel, EventFilterType } from '@/app/pages/Calendar/types'

export function useCalendarPageController(): CalendarPageViewModel {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<EventFilterType>('all')
  const canManageCalendar = user?.accountRole === AccountRole.ADMIN || user?.accountRole === AccountRole.MEMBER

  const tokens = useCalendarThemeTokens(isDark)
  const { tasks, events, projects, loading, error, setLoading, loadData, loadEvents } = useCalendarData(currentYear, currentMonth)
  const form = useCalendarEventForm({
    currentYear,
    currentMonth,
    selectedDay,
    today,
    events,
    onEventsUpdated: loadEvents,
  })

  const prevMonth = () => {
    setSelectedDay(null)
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else setCurrentMonth(currentMonth - 1)
  }

  const nextMonth = () => {
    setSelectedDay(null)
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else setCurrentMonth(currentMonth + 1)
  }

  const isToday = (year: number, month: number, day: number) =>
    today.getFullYear() === year && today.getMonth() + 1 === month && today.getDate() === day
  const getDayOfWeek = (day: number) => CALENDAR_PAGE_CONSTANTS.DAY_NAMES[new Date(currentYear, currentMonth - 1, day).getDay()]
  const getEventColorById = (eventId: number | undefined) => events.find((e: CalendarEvent) => e.id === eventId)?.color || '#3b82f6'

  const cells = useMemo(() => buildCalendarCells(currentYear, currentMonth), [currentYear, currentMonth])
  const getItemsForDateMemo = (year: number, month: number, day: number) =>
    getItemsForDate(year, month, day, filterType, tasks, events, projects)
  const selectedDayItems = selectedDay ? getItemsForDateMemo(currentYear, currentMonth, selectedDay) : []

  if (loading) {
    return { phase: 'loading', tokens: { pageBg: tokens.pageBg } }
  }

  if (error) {
    return {
      phase: 'error',
      tokens,
      error,
      onRetry: () => {
        setLoading(true)
        void loadData()
      },
    }
  }

  const projectOptions = [{ value: '', label: 'Без проекта' }, ...projects.map((p) => ({ value: String(p.id), label: p.name }))]

  const formPort = {
    showCreateModal: form.showCreateModal,
    setShowCreateModal: form.setShowCreateModal,
    showEditModal: form.showEditModal,
    setShowEditModal: form.setShowEditModal,
    setEditingEvent: form.setEditingEvent,
    createSessionId: form.createSessionId,
    createInitial: form.createInitial,
    submitCreate: form.submitCreate,
    editSessionId: form.editSessionId,
    editInitial: form.editInitial,
    submitEdit: form.submitEdit,
    openCreateForDay: form.openCreateForDay,
    openEditEvent: form.openEditEvent,
    handleDeleteEvent: form.handleDeleteEvent,
  }

  return {
    phase: 'ready',
    ui: { ...tokens, isDark },
    currentYear,
    currentMonth,
    selectedDay,
    setSelectedDay,
    filterType,
    setFilterType,
    canManageCalendar,
    cells,
    getItemsForDate: getItemsForDateMemo,
    selectedDayItems,
    getDayOfWeek,
    isToday,
    getEventColorById,
    headerTitle: `${CALENDAR_PAGE_CONSTANTS.MONTHS[currentMonth - 1]} ${currentYear}`,
    projectOptions,
    form: formPort,
    onPrevMonth: prevMonth,
    onNextMonth: nextMonth,
  }
}
