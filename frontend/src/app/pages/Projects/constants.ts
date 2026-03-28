import { ProjectStatus } from '@/app/types'

export const PAGE_SIZE = 12
export const SEARCH_DEBOUNCE_MS = 300
export const VISIBLE_PROJECT_STATUSES = [
  ProjectStatus.ACTIVE,
  ProjectStatus.ON_HOLD,
  ProjectStatus.COMPLETED,
] as const

export const CARD_COLORS = [
  'bg-[#4880ff]',
  'bg-[#10b981]',
  'bg-[#8b5cf6]',
  'bg-[#f59e0b]',
  'bg-[#ef4444]',
]

export const PROJECTS_PAGE_CONSTANTS = {
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  VISIBLE_PROJECT_STATUSES,
  CARD_COLORS,
} as const
