import type { LucideIcon } from 'lucide-react'

export type AboutStatsPeriod = 'month' | 'quarter' | 'year'

export type AboutValue = {
  icon: LucideIcon
  title: string
  description: string
}

export type AboutPeriodOption = {
  id: AboutStatsPeriod
  label: string
}

export type AboutPeriodStats = {
  projects: number
  tasks: number
  teams: number
  onTimeRate: number
}

export type AboutPageViewModel = {
  isDark: boolean
  activePeriod: AboutStatsPeriod
  setActivePeriod: (period: AboutStatsPeriod) => void
  pageBg: string
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
  stats: AboutPeriodStats
}
