import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Filter,
  CalendarDays,
  Tag,
} from 'lucide-react'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'
import { tasksApi } from '../api/tasks'
import { calendarApi } from '../api/calendar'
import { projectsApi } from '../api/projects'
import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../components/Modal'
import type { Task, CalendarEvent, Project } from '../types'
import { TaskStatus, TASK_STATUS_LABELS, AccountRole } from '../types'

const DAYS_OF_WEEK = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const DAY_NAMES = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

type EventFilterType = 'all' | 'tasks' | 'events'

interface CalItem {
  id: string
  type: 'task' | 'event'
  title: string
  color: string
  textColor: string
  time: string
  duration?: string
  description?: string
  status?: string
  eventId?: number
  taskId?: number
  projectName?: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  [TaskStatus.NEW]: { bg: 'bg-[#4880ff]', text: 'text-white' },
  [TaskStatus.IN_PROGRESS]: { bg: 'bg-amber-500', text: 'text-white' },
  [TaskStatus.REVIEW]: { bg: 'bg-purple-500', text: 'text-white' },
  [TaskStatus.DONE]: { bg: 'bg-emerald-500', text: 'text-white' },
  [TaskStatus.CANCELLED]: { bg: 'bg-red-500', text: 'text-white' },
}

const EVENT_COLORS = [
  { value: '#3b82f6', label: 'Синий' },
  { value: '#10b981', label: 'Зелёный' },
  { value: '#8b5cf6', label: 'Фиолетовый' },
  { value: '#f59e0b', label: 'Оранжевый' },
  { value: '#ef4444', label: 'Красный' },
  { value: '#ec4899', label: 'Розовый' },
  { value: '#06b6d4', label: 'Голубой' },
]

const DURATION_OPTIONS = [
  { value: '15', label: '15 минут' },
  { value: '30', label: '30 минут' },
  { value: '45', label: '45 минут' },
  { value: '60', label: '1 час' },
  { value: '90', label: '1.5 часа' },
  { value: '120', label: '2 часа' },
  { value: '180', label: '3 часа' },
  { value: '240', label: '4 часа' },
  { value: '480', label: '8 часов (весь день)' },
]

function getCalendarFallbackErrorMessage(source: 'projects' | 'events'): string {
  if (source === 'projects') {
    return 'Список проектов временно недоступен. Доступны задачи и события.'
  }

  return 'Список событий временно недоступен. Проверьте соединение и попробуйте снова.'
}

function formatDuration(startDate: string, endDate: string): string {
  const diffMs = new Date(endDate).getTime() - new Date(startDate).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `${mins} мин`
  const hrs = Math.floor(mins / 60)
  const remainMins = mins % 60
  if (remainMins === 0) return `${hrs} ч`
  return `${hrs} ч ${remainMins} мин`
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

export function Calendar() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [filterType, setFilterType] = useState<EventFilterType>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [formDuration, setFormDuration] = useState('60')
  const [formColor, setFormColor] = useState('#3b82f6')
  const [formProjectId, setFormProjectId] = useState('')
  const [formAllDay, setFormAllDay] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const canManageCalendar = user?.accountRole === AccountRole.ADMIN || user?.accountRole === AccountRole.MEMBER

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const dayCellBorder = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const dayCellHover = isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
  const dayHeaderBg = isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'
  const modalBg = isDark ? 'bg-[#273142]' : 'bg-white'

  const loadStaticData = useCallback(async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        tasksApi.list({ limit: 500 }),
        projectsApi.list({ limit: 100 }).catch(() => {
          setError(getCalendarFallbackErrorMessage('projects'))
          return { items: [] as Project[], total: 0, page: 1, limit: 100, totalPages: 0 }
        }),
      ])
      setTasks(tasksRes.items)
      setProjects(projectsRes.items)
    } catch {
      setError('Не удалось загрузить данные календаря. Попробуйте обновить страницу.')
    }
  }, [])

  const loadEvents = useCallback(async () => {
    try {
      const from = new Date(currentYear, currentMonth - 1, 1).toISOString()
      const to = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString()
      const eventsRes = await calendarApi.list({ limit: 500, from, to }).catch(() => {
        setError(getCalendarFallbackErrorMessage('events'))
        return { items: [] as CalendarEvent[], total: 0, page: 1, limit: 500, totalPages: 0 }
      })
      setEvents(eventsRes.items)
    } catch {
      setError('Не удалось загрузить события календаря. Попробуйте обновить страницу.')
    }
  }, [currentYear, currentMonth])

  const loadData = useCallback(async () => {
    setError('')
    try {
      await Promise.all([loadStaticData(), loadEvents()])
    } finally {
      setLoading(false)
    }
  }, [loadStaticData, loadEvents])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return ''
    return projects.find((p) => p.id === projectId)?.name || ''
  }

  const toLocalDateStr = (isoString: string): string => {
    const d = new Date(isoString)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const getItemsForDate = (year: number, month: number, day: number): CalItem[] => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const items: CalItem[] = []

    if (filterType === 'all' || filterType === 'tasks') {
      tasks
        .filter((t) => t.deadline && toLocalDateStr(t.deadline) === dateStr)
        .forEach((t) => {
          const sc = STATUS_COLORS[t.status] || STATUS_COLORS[TaskStatus.NEW]
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
            projectName: getProjectName(t.projectId),
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
            projectName: getProjectName(e.projectId),
          })
        })
    }

    return items.sort((a, b) => a.time.localeCompare(b.time))
  }

  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  const prevMonth = () => {
    setSelectedDay(null)
    if (currentMonth === 1) { setCurrentMonth(12); setCurrentYear(currentYear - 1) }
    else setCurrentMonth(currentMonth - 1)
  }

  const nextMonth = () => {
    setSelectedDay(null)
    if (currentMonth === 12) { setCurrentMonth(1); setCurrentYear(currentYear + 1) }
    else setCurrentMonth(currentMonth + 1)
  }

  const isToday = (year: number, month: number, day: number) =>
    today.getFullYear() === year &&
    today.getMonth() + 1 === month &&
    today.getDate() === day

  const handleDayClick = (day: number) => {
    setSelectedDay(day)
  }

  const selectedDayItems = selectedDay
    ? getItemsForDate(currentYear, currentMonth, selectedDay)
    : []

  const getDayOfWeek = (day: number) => {
    const date = new Date(currentYear, currentMonth - 1, day)
    return DAY_NAMES[date.getDay()]
  }

  const openCreateForDay = (day?: number) => {
    const d = day || selectedDay || today.getDate()
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    setFormTitle('')
    setFormDesc('')
    setFormDate(dateStr)
    setFormTime('09:00')
    setFormDuration('60')
    setFormColor('#3b82f6')
    setFormProjectId('')
    setFormAllDay(false)
    setFormError('')
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      const startDate = new Date(`${formDate}T${formTime}:00`).toISOString()
      const endDate = new Date(new Date(`${formDate}T${formTime}:00`).getTime() + Number(formDuration) * 60000).toISOString()
      await calendarApi.create({
        title: formTitle,
        description: formDesc || undefined,
        startDate,
        endDate,
        color: formColor,
        projectId: formProjectId ? Number(formProjectId) : undefined,
        allDay: formAllDay,
      })
      setShowCreateModal(false)
      await loadEvents()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      setFormLoading(false)
    }
  }

  const openEditEvent = (eventId: number) => {
    const ev = events.find((e) => e.id === eventId)
    if (!ev) return
    setEditingEvent(ev)
    const start = new Date(ev.startDate)
    setFormTitle(ev.title)
    setFormDesc(ev.description || '')
    setFormDate(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`)
    setFormTime(start.toTimeString().slice(0, 5))
    const diffMin = Math.round((new Date(ev.endDate).getTime() - start.getTime()) / 60000)
    setFormDuration(String(diffMin))
    setFormColor(ev.color)
    setFormProjectId(ev.projectId ? String(ev.projectId) : '')
    setFormAllDay(ev.allDay)
    setFormError('')
    setShowEditModal(true)
  }

  const handleEdit = async () => {
    if (!editingEvent) return
    setFormLoading(true)
    setFormError('')
    try {
      const startDate = new Date(`${formDate}T${formTime}:00`).toISOString()
      const endDate = new Date(new Date(`${formDate}T${formTime}:00`).getTime() + Number(formDuration) * 60000).toISOString()
      await calendarApi.update(editingEvent.id, {
        title: formTitle,
        description: formDesc,
        startDate,
        endDate,
        color: formColor,
        projectId: formProjectId ? Number(formProjectId) : null,
        allDay: formAllDay,
      })
      setShowEditModal(false)
      setEditingEvent(null)
      await loadEvents()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка обновления')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Удалить событие?')) return
    try {
      await calendarApi.delete(eventId)
      await loadEvents()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  // Build a stable 6-week calendar grid (42 cells) including previous/next month days.
  // Next-month days are muted by reduced opacity.
  const nextMonthDate = new Date(currentYear, currentMonth, 1)
  const nextMonthNumber = nextMonthDate.getMonth() + 1
  const nextYear = nextMonthDate.getFullYear()
  const gridStartDate = new Date(currentYear, currentMonth - 1, 1 - firstDayOfMonth)

  const cells: Array<{
    year: number
    month: number
    day: number
    inCurrentMonth: boolean
    isNextMonth: boolean
  }> = []

  for (let i = 0; i < 42; i++) {
    const date = new Date(
      gridStartDate.getFullYear(),
      gridStartDate.getMonth(),
      gridStartDate.getDate() + i,
    )

    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    cells.push({
      year,
      month,
      day,
      inCurrentMonth: year === currentYear && month === currentMonth,
      isNextMonth: year === nextYear && month === nextMonthNumber,
    })
  }

  const filterBtns: { key: EventFilterType; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'tasks', label: 'Задачи' },
    { key: 'events', label: 'События' },
  ]

  if (loading) {
    return (
      <div className={`${pageBg} min-h-full flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${pageBg} min-h-full p-8`}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <CalendarDays className="w-10 h-10 text-red-500" />
          <p className={`text-lg font-bold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`text-sm ${textSecondary} text-center max-w-md`}>{error}</p>
          <button onClick={() => { setLoading(true); loadData() }} className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            Повторить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 page-load-stagger">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>{MONTHS[currentMonth - 1]} {currentYear}</h1>
          <p className={`mt-1 text-sm ${textSecondary}`}>Дедлайны задач и события на календаре</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#f4f3f2] hover:bg-[#273142]' : 'text-[#202224] hover:bg-gray-100'}`}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#f4f3f2] hover:bg-[#273142]' : 'text-[#202224] hover:bg-gray-100'}`}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          {canManageCalendar && (
            <button
              onClick={() => openCreateForDay()}
              className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 btn-fizzy"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Событие</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap page-load-stagger">
        <Filter className={`w-4 h-4 ${textSecondary}`} />
        {filterBtns.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterType(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterType === f.key
                ? 'bg-[#4880ff] text-white'
                : isDark
                  ? 'bg-[#273142] text-[#94a3b8] hover:text-white'
                  : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        <div className={`grid grid-cols-7 ${dayHeaderBg}`}>
          {DAYS_OF_WEEK.map((d) => (
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
                onClick={clickable ? () => handleDayClick(day) : undefined}
                className={`border-t border-r ${dayCellBorder} min-h-[80px] md:min-h-[110px] p-1.5 md:p-2 transition-colors ${
                  colIdx === 6 ? 'border-r-0' : ''
                } ${clickable ? dayCellHover : ''} ${
                  todayCell ? (isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50/60') : ''
                } ${mutedOpacity} ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${
                      todayCell
                        ? 'bg-[#4880ff] text-white'
                        : inCurrentMonth
                          ? textPrimary
                          : textSecondary
                    }`}
                  >
                    {day}
                  </span>
                </div>
                <div className="space-y-0.5 md:space-y-1">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className={`text-[9px] md:text-[10px] font-semibold px-1 md:px-1.5 py-0.5 rounded truncate ${
                        item.type === 'task'
                          ? `${item.color} ${item.textColor}`
                          : 'text-white'
                      }`}
                      style={
                        item.type === 'event'
                          ? {
                              backgroundColor:
                                events.find((e) => e.id === item.eventId)?.color ||
                                '#3b82f6',
                            }
                          : undefined
                      }
                    >
                      {item.type === 'event' && (
                        <span className="mr-0.5">&#9679;</span>
                      )}
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div className={`text-[9px] md:text-[10px] font-semibold ${textSecondary}`}>
                      +{dayItems.length - 2} ещё
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedDay !== null && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 modal-overlay-enter" onClick={() => setSelectedDay(null)}>
          <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden modal-content-enter`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
              <div>
                <h2 className={`font-bold text-lg ${textPrimary}`}>{selectedDay} {MONTHS[currentMonth - 1]}</h2>
                <p className={`text-sm capitalize ${textSecondary}`}>
                  {getDayOfWeek(selectedDay)}
                  {isToday(currentYear, currentMonth, selectedDay) && (
                    <span className="ml-2 text-[10px] font-bold bg-[#4880ff] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Сегодня</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canManageCalendar && (
                  <button
                    onClick={() => openCreateForDay(selectedDay)}
                    className="p-2 rounded-lg bg-[#4880ff] text-white hover:bg-[#3a6fe0] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelectedDay(null)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1c2534] text-[#94a3b8]' : 'hover:bg-gray-100 text-gray-400'}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {selectedDayItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                    <Clock className={`w-6 h-6 ${textSecondary}`} />
                  </div>
                  <p className={`text-sm font-semibold ${textSecondary}`}>Нет событий</p>
                  <p className={`text-xs ${textSecondary}`}>В этот день нет задач и событий</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayItems.map((item) => (
                    <div key={item.id} className={`flex gap-3 p-3 md:p-4 rounded-xl ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                      <div
                        className={`w-1 rounded-full shrink-0 ${item.type === 'task' ? item.color : ''}`}
                        style={item.type === 'event' ? { backgroundColor: events.find((e) => e.id === item.eventId)?.color || '#3b82f6' } : undefined}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {item.type === 'event' && <CalendarDays className="w-3 h-3 text-[#4880ff] shrink-0" />}
                            {item.type === 'task' && <Tag className="w-3 h-3 text-amber-500 shrink-0" />}
                            <p className={`font-semibold text-sm ${textPrimary} truncate`}>{item.title}</p>
                          </div>
                          {item.type === 'task' && item.status && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.color} ${item.textColor} shrink-0`}>
                              {TASK_STATUS_LABELS[item.status as TaskStatus] || item.status}
                            </span>
                          )}
                        </div>
                        {item.description && <p className={`text-xs ${textSecondary} mb-1`}>{item.description}</p>}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`text-xs ${textSecondary}`}>{item.time}</span>
                          {item.duration && (
                            <span className={`text-xs ${textSecondary} flex items-center gap-1`}>
                              <Clock className="w-3 h-3" /> {item.duration}
                            </span>
                          )}
                          {item.projectName && (
                            <span className={`text-xs ${textSecondary}`}>{item.projectName}</span>
                          )}
                          {item.type === 'event' && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isDark ? 'bg-[#4880ff]/15 text-[#4880ff]' : 'bg-blue-50 text-[#4880ff]'}`}>
                              Событие
                            </span>
                          )}
                        </div>
                        {item.type === 'event' && canManageCalendar && item.eventId && (
                          <div className="flex items-center gap-1 mt-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); openEditEvent(item.eventId!) }}
                              className="p-1 rounded hover:bg-[#4880ff]/10 text-[#4880ff] transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(item.eventId!) }}
                              className="p-1 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`px-6 py-4 border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'} flex justify-between items-center`}>
              <span className={`text-xs ${textSecondary}`}>
                {selectedDayItems.length > 0
                  ? `${selectedDayItems.filter((i) => i.type === 'task').length} задач, ${selectedDayItems.filter((i) => i.type === 'event').length} событий`
                  : 'Нет записей'}
              </span>
            </div>
          </div>
        </div>,
        document.body,
      )}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новое событие">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleCreate() }} className="space-y-4">
          <InputField label="Название" value={formTitle} onChange={setFormTitle} required placeholder="Дейлик, созвон, корпоратив..." />
          <InputField label="Описание" value={formDesc} onChange={setFormDesc} placeholder="Описание события" />
          <InputField label="Дата" value={formDate} onChange={setFormDate} type="date" required />
          <InputField label="Время начала" value={formTime} onChange={setFormTime} type="time" required />
          <SelectField
            label="Продолжительность"
            value={formDuration}
            onChange={setFormDuration}
            options={DURATION_OPTIONS}
          />
          <SelectField
            label="Проект (необязательно)"
            value={formProjectId}
            onChange={setFormProjectId}
            options={[
              { value: '', label: 'Без проекта' },
              ...projects.map((p) => ({ value: String(p.id), label: p.name })),
            ]}
          />
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-[#94a3b8]' : 'text-[#737373]'}`}>Цвет</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${formColor === c.value ? 'ring-2 ring-offset-2 ring-[#4880ff]' : ''}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formAllDay}
              onChange={(e) => setFormAllDay(e.target.checked)}
            />
            <span>Весь день</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Создать</SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingEvent(null) }} title="Редактировать событие">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleEdit() }} className="space-y-4">
          <InputField label="Название" value={formTitle} onChange={setFormTitle} required />
          <InputField label="Описание" value={formDesc} onChange={setFormDesc} />
          <InputField label="Дата" value={formDate} onChange={setFormDate} type="date" required />
          <InputField label="Время начала" value={formTime} onChange={setFormTime} type="time" required />
          <SelectField
            label="Продолжительность"
            value={formDuration}
            onChange={setFormDuration}
            options={DURATION_OPTIONS}
          />
          <SelectField
            label="Проект (необязательно)"
            value={formProjectId}
            onChange={setFormProjectId}
            options={[
              { value: '', label: 'Без проекта' },
              ...projects.map((p) => ({ value: String(p.id), label: p.name })),
            ]}
          />
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-[#94a3b8]' : 'text-[#737373]'}`}>Цвет</label>
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormColor(c.value)}
                  className={`w-8 h-8 rounded-full transition-all ${formColor === c.value ? 'ring-2 ring-offset-2 ring-[#4880ff]' : ''}`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formAllDay}
              onChange={(e) => setFormAllDay(e.target.checked)}
            />
            <span>Весь день</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setShowEditModal(false); setEditingEvent(null) }} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Сохранить</SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
