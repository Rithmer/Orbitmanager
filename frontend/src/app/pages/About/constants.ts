import {
  Clock3,
  ListTodo,
  Target,
  Users,
  ShieldCheck,
  BriefcaseBusiness,
} from 'lucide-react'
import type {
  AboutPeriodOption,
  AboutValue,
} from '@/app/pages/About/types'

export const values: AboutValue[] = [
  {
    icon: Target,
    title: 'Фокус на результате',
    description:
      'Помогаем компаниям запускать проекты быстрее и снижать количество срывов сроков за счет прозрачного процесса.',
  },
  {
    icon: Users,
    title: 'Команды в центре',
    description:
      'Создаем удобное пространство, где руководители, менеджеры и исполнители работают синхронно и без лишней рутины.',
  },
  {
    icon: ShieldCheck,
    title: 'Надежность и контроль',
    description:
      'Поддерживаем контроль статусов, рисков и приоритетов, чтобы управленческие решения принимались на основе актуальных данных.',
  },
]

export const periodOptions: AboutPeriodOption[] = [
  { id: 'month', label: 'Месяц' },
  { id: 'quarter', label: 'Квартал' },
  { id: 'year', label: 'Год' },
]

export const ABOUT_PAGE_ICONS = {
  projects: BriefcaseBusiness,
  tasks: ListTodo,
  teams: Users,
  onTimeRate: Clock3,
} as const
