import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { tasksApi } from '../api/tasks'
import type { Task } from '../types'
import { TaskStatus, TASK_STATUS_LABELS } from '../types'

const DAYS_OF_WEEK = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const DAY_NAMES = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']

interface CalEvent {
  taskId: number
  title: string
  color: string
  textColor: string
  time: string
  description?: string
  status: string
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay()
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  [TaskStatus.NEW]: { bg: 'bg-[#4880ff]', text: 'text-white' },
  [TaskStatus.IN_PROGRESS]: { bg: 'bg-amber-500', text: 'text-white' },
  [TaskStatus.REVIEW]: { bg: 'bg-purple-500', text: 'text-white' },
  [TaskStatus.DONE]: { bg: 'bg-emerald-500', text: 'text-white' },
  [TaskStatus.CANCELLED]: { bg: 'bg-red-500', text: 'text-white' },
}

export function Calendar() {
  const { isDark } = useTheme()
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<{ day: number; events: CalEvent[] } | null>(null)

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const dayCellBorder = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const dayCellHover = isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
  const dayHeaderBg = isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'
  const modalBg = isDark ? 'bg-[#273142]' : 'bg-white'

  useEffect(() => {
    const load = async () => {
      try {
        const res = await tasksApi.list({ limit: 500 })
        setTasks(res.items)
      } catch {
        /* skip */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getEventsForDay = (day: number): CalEvent[] => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return tasks
      .filter((t) => t.deadline && t.deadline.startsWith(dateStr))
      .map((t) => {
        const sc = STATUS_COLORS[t.status] || STATUS_COLORS[TaskStatus.NEW]
        return {
          taskId: t.id,
          title: t.name,
          color: sc.bg,
          textColor: sc.text,
          time: new Date(t.deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          description: t.description,
          status: t.status,
        }
      })
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth)

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  const isToday = (day: number) =>
    today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth && today.getDate() === day

  const handleDayClick = (day: number) => {
    setSelectedDay({ day, events: getEventsForDay(day) })
  }

  const getDayOfWeek = (day: number) => {
    const date = new Date(currentYear, currentMonth - 1, day)
    return DAY_NAMES[date.getDay()]
  }

  const cells: Array<{ type: 'empty' } | { type: 'day'; day: number }> = []
  for (let i = 0; i < firstDayOfMonth; i++) cells.push({ type: 'empty' })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ type: 'day', day: d })

  if (loading) {
    return (
      <div className={`${pageBg} min-h-full flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`${pageBg} min-h-full p-8`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>{MONTHS[currentMonth - 1]} {currentYear}</h1>
          <p className={`mt-1 text-sm ${textSecondary}`}>Дедлайны задач на календаре</p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#f4f3f2] hover:bg-[#273142]' : 'text-[#202224] hover:bg-gray-100'}`}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className={`p-2 rounded-lg transition-colors ${isDark ? 'text-[#f4f3f2] hover:bg-[#273142]' : 'text-[#202224] hover:bg-gray-100'}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        <div className={`grid grid-cols-7 ${dayHeaderBg}`}>
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className={`py-3 text-center text-xs font-bold uppercase tracking-wider ${textSecondary}`}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            if (cell.type === 'empty') {
              return <div key={`empty-${idx}`} className={`border-t border-r ${dayCellBorder} min-h-[110px] ${idx % 7 === 6 ? 'border-r-0' : ''}`} />
            }
            const { day } = cell
            const events = getEventsForDay(day)
            const todayCell = isToday(day)
            const colIdx = (firstDayOfMonth + day - 1) % 7

            return (
              <div
                key={`day-${day}`}
                onClick={() => handleDayClick(day)}
                className={`border-t border-r ${dayCellBorder} min-h-[110px] p-2 transition-colors cursor-pointer
                  ${colIdx === 6 ? 'border-r-0' : ''}
                  ${dayCellHover}
                  ${todayCell ? (isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50/60') : ''}
                `}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${todayCell ? 'bg-[#4880ff] text-white' : textPrimary}`}>
                    {day}
                  </span>
                </div>
                <div className="space-y-1">
                  {events.slice(0, 2).map((ev, i) => (
                    <div key={i} className={`${ev.color} ${ev.textColor} text-[10px] font-semibold px-1.5 py-0.5 rounded truncate`}>
                      {ev.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className={`text-[10px] font-semibold ${textSecondary}`}>+{events.length - 2} ещё</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Day Detail Modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setSelectedDay(null)}>
          <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
              <div>
                <h2 className={`font-bold text-lg ${textPrimary}`}>{selectedDay.day} {MONTHS[currentMonth - 1]}</h2>
                <p className={`text-sm capitalize ${textSecondary}`}>
                  {getDayOfWeek(selectedDay.day)}
                  {isToday(selectedDay.day) && (
                    <span className="ml-2 text-[10px] font-bold bg-[#4880ff] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Сегодня</span>
                  )}
                </p>
              </div>
              <button onClick={() => setSelectedDay(null)} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1c2534] text-[#94a3b8]' : 'hover:bg-gray-100 text-gray-400'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {selectedDay.events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                    <Clock className={`w-6 h-6 ${textSecondary}`} />
                  </div>
                  <p className={`text-sm font-semibold ${textSecondary}`}>Дедлайнов нет</p>
                  <p className={`text-xs ${textSecondary}`}>В этот день нет задач с дедлайном</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDay.events.map((ev, i) => (
                    <div key={i} className={`flex gap-4 p-4 rounded-xl ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                      <div className={`w-1 rounded-full ${ev.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={`font-semibold text-sm ${textPrimary} truncate`}>{ev.title}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ev.color} ${ev.textColor} shrink-0`}>
                            {TASK_STATUS_LABELS[ev.status as TaskStatus] || ev.status}
                          </span>
                        </div>
                        {ev.description && <p className={`text-xs ${textSecondary} mb-1`}>{ev.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`px-6 py-4 border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'} flex justify-between items-center`}>
              <span className={`text-xs ${textSecondary}`}>
                {selectedDay.events.length > 0
                  ? `${selectedDay.events.length} ${selectedDay.events.length === 1 ? 'задача' : selectedDay.events.length < 5 ? 'задачи' : 'задач'}`
                  : 'Нет задач'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
