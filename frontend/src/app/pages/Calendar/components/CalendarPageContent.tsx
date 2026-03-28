import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { useTheme } from '@/app/context/useTheme'
import { useAuth } from '@/app/context/useAuth'
import { AccountRole, type CalendarEvent } from '@/app/types'
import { CALENDAR_PAGE_CONSTANTS } from '@/app/pages/Calendar/constants'
import { buildCalendarCells, getItemsForDate } from '@/app/pages/Calendar/helpers'
import { useCalendarData } from '@/app/pages/Calendar/hooks/useCalendarData'
import { useCalendarEventForm } from '@/app/pages/Calendar/hooks/useCalendarEventForm'
import { useCalendarThemeTokens } from '@/app/pages/Calendar/hooks/useCalendarThemeTokens'
import type { EventFilterType } from '@/app/pages/Calendar/types'
import { CalendarFilters } from '@/app/pages/Calendar/components/CalendarFilters'
import { CalendarGrid } from '@/app/pages/Calendar/components/CalendarGrid'
import { CalendarHeader } from '@/app/pages/Calendar/components/CalendarHeader'
import { EventFormModal, SelectedDayModal } from '@/app/pages/Calendar/components/CalendarModals'

export function CalendarPageContent() {
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
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1) } else setCurrentMonth(currentMonth - 1)
  }

  const nextMonth = () => {
    setSelectedDay(null)
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1) } else setCurrentMonth(currentMonth + 1)
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
    return (
      <div className={`${tokens.pageBg} min-h-full flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${tokens.pageBg} min-h-full p-8`}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <CalendarDays className="w-10 h-10 text-red-500" />
          <p className={`text-lg font-bold ${tokens.textPrimary}`}>Ошибка загрузки</p>
          <p className={`text-sm ${tokens.textSecondary} text-center max-w-md`}>{error}</p>
          <button onClick={() => { setLoading(true); void loadData() }} className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            Повторить
          </button>
        </div>
      </div>
    )
  }

  const projectOptions = [{ value: '', label: 'Без проекта' }, ...projects.map((p) => ({ value: String(p.id), label: p.name }))]

  return (
    <div className={`${tokens.pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <CalendarHeader
        title={`${CALENDAR_PAGE_CONSTANTS.MONTHS[currentMonth - 1]} ${currentYear}`}
        subtitle="Дедлайны задач и события на календаре"
        isDark={isDark}
        textPrimary={tokens.textPrimary}
        textSecondary={tokens.textSecondary}
        canManageCalendar={canManageCalendar}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
        onCreateEvent={() => form.openCreateForDay()}
      />
      <CalendarFilters
        textSecondary={tokens.textSecondary}
        isDark={isDark}
        filterType={filterType}
        filterButtons={CALENDAR_PAGE_CONSTANTS.FILTER_BUTTONS}
        onChange={setFilterType}
      />
      <CalendarGrid
        cells={cells}
        cardBg={tokens.cardBg}
        cardBorder={tokens.cardBorder}
        dayHeaderBg={tokens.dayHeaderBg}
        dayCellBorder={tokens.dayCellBorder}
        dayCellHover={tokens.dayCellHover}
        textPrimary={tokens.textPrimary}
        textSecondary={tokens.textSecondary}
        isDark={isDark}
        getItemsForDate={getItemsForDateMemo}
        getEventColorById={getEventColorById}
        isToday={isToday}
        onSelectDay={setSelectedDay}
      />
      <SelectedDayModal
        selectedDay={selectedDay}
        currentMonth={currentMonth}
        currentYear={currentYear}
        selectedDayItems={selectedDayItems}
        canManageCalendar={canManageCalendar}
        isDark={isDark}
        modalBg={tokens.modalBg}
        textPrimary={tokens.textPrimary}
        textSecondary={tokens.textSecondary}
        getDayOfWeek={getDayOfWeek}
        isToday={isToday}
        getEventColorById={getEventColorById}
        onClose={() => setSelectedDay(null)}
        onCreateForDay={form.openCreateForDay}
        onEditEvent={form.openEditEvent}
        onDeleteEvent={form.handleDeleteEvent}
      />
      <EventFormModal
        open={form.showCreateModal}
        title="Новое событие"
        formError={form.formError}
        formTitle={form.formTitle}
        formDesc={form.formDesc}
        formDate={form.formDate}
        formTime={form.formTime}
        formDuration={form.formDuration}
        formProjectId={form.formProjectId}
        formColor={form.formColor}
        formAllDay={form.formAllDay}
        formLoading={form.formLoading}
        isDark={isDark}
        textSecondary={tokens.textSecondary}
        projectOptions={projectOptions}
        onClose={() => form.setShowCreateModal(false)}
        onSubmit={form.handleCreate}
        setFormTitle={form.setFormTitle}
        setFormDesc={form.setFormDesc}
        setFormDate={form.setFormDate}
        setFormTime={form.setFormTime}
        setFormDuration={form.setFormDuration}
        setFormProjectId={form.setFormProjectId}
        setFormColor={form.setFormColor}
        setFormAllDay={form.setFormAllDay}
      />
      <EventFormModal
        open={form.showEditModal}
        title="Редактировать событие"
        formError={form.formError}
        formTitle={form.formTitle}
        formDesc={form.formDesc}
        formDate={form.formDate}
        formTime={form.formTime}
        formDuration={form.formDuration}
        formProjectId={form.formProjectId}
        formColor={form.formColor}
        formAllDay={form.formAllDay}
        formLoading={form.formLoading}
        isDark={isDark}
        textSecondary={tokens.textSecondary}
        projectOptions={projectOptions}
        onClose={() => { form.setShowEditModal(false); form.setEditingEvent(null) }}
        onSubmit={form.handleEdit}
        setFormTitle={form.setFormTitle}
        setFormDesc={form.setFormDesc}
        setFormDate={form.setFormDate}
        setFormTime={form.setFormTime}
        setFormDuration={form.setFormDuration}
        setFormProjectId={form.setFormProjectId}
        setFormColor={form.setFormColor}
        setFormAllDay={form.setFormAllDay}
      />
    </div>
  )
}