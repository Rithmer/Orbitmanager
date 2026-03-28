import { TaskStatus } from '@/app/types'
import type { EventFilterType } from '@/app/pages/Calendar/types'

export const CALENDAR_PAGE_CONSTANTS = {
  DAYS_OF_WEEK: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  MONTHS: [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
  ],
  DAY_NAMES: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'],
  STATUS_COLORS: {
    [TaskStatus.NEW]: { bg: 'bg-[#4880ff]', text: 'text-white' },
    [TaskStatus.IN_PROGRESS]: { bg: 'bg-amber-500', text: 'text-white' },
    [TaskStatus.REVIEW]: { bg: 'bg-purple-500', text: 'text-white' },
    [TaskStatus.DONE]: { bg: 'bg-emerald-500', text: 'text-white' },
    [TaskStatus.CANCELLED]: { bg: 'bg-red-500', text: 'text-white' },
  } as const,
  EVENT_COLORS: [
    { value: '#3b82f6', label: 'Синий' },
    { value: '#10b981', label: 'Зелёный' },
    { value: '#8b5cf6', label: 'Фиолетовый' },
    { value: '#f59e0b', label: 'Оранжевый' },
    { value: '#ef4444', label: 'Красный' },
    { value: '#ec4899', label: 'Розовый' },
    { value: '#06b6d4', label: 'Голубой' },
  ],
  DURATION_OPTIONS: [
    { value: '15', label: '15 минут' },
    { value: '30', label: '30 минут' },
    { value: '45', label: '45 минут' },
    { value: '60', label: '1 час' },
    { value: '90', label: '1.5 часа' },
    { value: '120', label: '2 часа' },
    { value: '180', label: '3 часа' },
    { value: '240', label: '4 часа' },
    { value: '480', label: '8 часов (весь день)' },
  ],
  FILTER_BUTTONS: [
    { key: 'all' as EventFilterType, label: 'Все' },
    { key: 'tasks' as EventFilterType, label: 'Задачи' },
    { key: 'events' as EventFilterType, label: 'События' },
  ],
} as const
