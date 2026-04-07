import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutGrid,
  FolderOpen,
  ClipboardList,
  Users,
  CalendarDays,
  PieChart,
  Building2,
  TriangleAlert,
  Settings2,
  ShieldCheck,
} from 'lucide-react'

export type LayoutNavItem = {
  path: string
  label: string
  icon: LucideIcon
  end: boolean
}

export function useLayoutNavItems(
  boardNavPath: string,
  isAdmin: boolean,
  canSeeProjectsNav: boolean,
  projectsNavLoading: boolean,
  canSeeAnalyticsNav: boolean,
  analyticsNavLoading: boolean,
  canSeeRisksNav: boolean,
  risksNavLoading: boolean,
): LayoutNavItem[] {
  return useMemo(
    () => [
      { path: '/', label: 'Главная', icon: LayoutGrid, end: true },
      ...(isAdmin || (!projectsNavLoading && canSeeProjectsNav)
        ? [{ path: '/projects', label: 'Проекты', icon: FolderOpen, end: false as const }]
        : []),
      { path: boardNavPath, label: 'Задачи', icon: ClipboardList, end: false },
      { path: '/teams', label: 'Команды', icon: Users, end: false },
      { path: '/calendar', label: 'Календарь', icon: CalendarDays, end: false },
      ...(isAdmin || (!analyticsNavLoading && canSeeAnalyticsNav)
        ? [{ path: '/reports', label: 'Аналитика', icon: PieChart, end: false as const }]
        : []),
      ...(isAdmin || (!risksNavLoading && canSeeRisksNav)
        ? [{ path: '/risks', label: 'Риски', icon: TriangleAlert, end: false as const }]
        : []),
      { path: '/settings', label: 'Настройки', icon: Settings2, end: false },
      ...(isAdmin
        ? [{ path: '/admin', label: 'Админ-панель', icon: ShieldCheck, end: false as const }]
        : []),
      { path: '/about', label: 'О нас', icon: Building2, end: false },
    ],
    [
      boardNavPath,
      isAdmin,
      canSeeProjectsNav,
      projectsNavLoading,
      canSeeAnalyticsNav,
      analyticsNavLoading,
      canSeeRisksNav,
      risksNavLoading,
    ],
  )
}
