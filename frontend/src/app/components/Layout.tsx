import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router'
import {
  LayoutGrid,
  FolderOpen,
  ClipboardList,
  Users,
  CalendarDays,
  PieChart,
  Settings2,
  Menu,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'
import { useAnalyticsSectionAccess } from '../hooks/useAnalyticsSectionAccess'
import { useProjectsSectionAccess } from '../hooks/useProjectsSectionAccess'
import { AccountRole, ACCOUNT_ROLE_LABELS } from '../types'
import {
  readLastBoardProjectId,
  LAST_BOARD_PROJECT_CHANGED_EVENT,
} from '../utils/lastBoardProjectStorage'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bounceKey, setBounceKey] = useState(0)
  const bounceTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const { isDark } = useTheme()
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  const { allowed: canSeeProjectsNav, isLoading: projectsNavLoading } = useProjectsSectionAccess()
  const { allowed: canSeeAnalyticsNav, isLoading: analyticsNavLoading } = useAnalyticsSectionAccess()

  const [boardNavPath, setBoardNavPath] = useState(
    () => `/board/${readLastBoardProjectId() ?? 0}`,
  )

  useEffect(() => {
    const syncBoardNav = () => setBoardNavPath(`/board/${readLastBoardProjectId() ?? 0}`)
    window.addEventListener(LAST_BOARD_PROJECT_CHANGED_EVENT, syncBoardNav)
    return () => window.removeEventListener(LAST_BOARD_PROJECT_CHANGED_EVENT, syncBoardNav)
  }, [])

  const toggleSidebar = () => {
    const next = !sidebarOpen
    setSidebarOpen(next)
    if (next) {
      setBounceKey((k) => k + 1)
      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current)
      bounceTimerRef.current = setTimeout(() => setBounceKey(0), 800)
    }
  }

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navItems = [
    { path: '/', label: 'Главная', icon: LayoutGrid, end: true },
    ...(isAdmin || (!projectsNavLoading && canSeeProjectsNav)
      ? [{ path: '/projects', label: 'Проекты', icon: FolderOpen, end: false }]
      : []),
    { path: boardNavPath, label: 'Задачи', icon: ClipboardList, end: false },
    { path: '/teams', label: 'Команды', icon: Users, end: false },
    { path: '/calendar', label: 'Календарь', icon: CalendarDays, end: false },
    ...(isAdmin || (!analyticsNavLoading && canSeeAnalyticsNav)
      ? [{ path: '/reports', label: 'Аналитика', icon: PieChart, end: false }]
      : []),
    { path: '/settings', label: 'Настройки', icon: Settings2, end: false },
    ...(isAdmin
      ? [{ path: '/admin', label: 'Админ-панель', icon: ShieldCheck, end: false }]
      : []),
  ]

  const sidebarBg = isDark ? 'bg-[#1b2431]' : 'bg-white'
  const sidebarBorderColor = isDark ? 'border-[#273142]' : 'border-[#e8e8e8]'
  const mainBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const logoTextColor = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const navTextInactive = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const navHover = isDark ? 'hover:bg-[#273142]' : 'hover:bg-[#f0f4ff]'
  const profileNameColor = isDark ? 'text-[#f4f3f2]' : 'text-[#404040]'
  const profileRoleColor = isDark ? 'text-[#94a3b8]' : 'text-[#565656]'
  const burgerColor = isDark ? 'text-[#f4f3f2]' : 'text-[#1a202c]'
  const burgerHover = isDark ? 'hover:bg-[#313d4f]' : 'hover:bg-gray-100'

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || 'U'
  const roleLabel = user ? ACCOUNT_ROLE_LABELS[user.accountRole as AccountRole] || user.accountRole : ''

  const handleNavClick = () => {
    setMobileOpen(false)
  }

  const logoLetters = (text: string, color: string, startDelay: number) => {
    if (bounceKey > 0) {
      return text.split('').map((ch, i) => (
        <span key={`${bounceKey}-${i}`} className={`${color} letter-bounce`} style={{ animationDelay: `${startDelay + i * 30}ms` }}>
          {ch}
        </span>
      ))
    }
    return <span className={color}>{text}</span>
  }

  const sidebarContent = (isMobile: boolean) => (
    <>
      <div
        className={`
          h-[70px] flex items-center border-b ${sidebarBorderColor}
          ${isMobile || sidebarOpen ? 'px-6 justify-between' : 'justify-center px-0'}
          transition-all duration-300 shrink-0
        `}
      >
        <div
          onClick={() => {
            if (isMobile) setMobileOpen(false)
            else toggleSidebar()
          }}
          className="text-xl font-extrabold select-none cursor-pointer"
        >
          {isMobile || sidebarOpen ? (
            <>
              {logoLetters('Orbit', 'text-[#4880ff]', 0)}
              {logoLetters('Manager', logoTextColor, 150)}
            </>
          ) : (
            <span className="text-[#4880ff]">O</span>
          )}
        </div>
        {isMobile && (
          <button onClick={() => setMobileOpen(false)} className={`p-2 rounded-lg ${burgerColor} ${burgerHover}`}>
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-5 overflow-y-auto overflow-x-hidden">
        <ul className={`space-y-1 ${isMobile || sidebarOpen ? 'px-3' : 'px-2'}`}>
          {navItems.map((item, idx) => (
            <li
              key={bounceKey > 0 && !isMobile ? `${item.path}-${bounceKey}` : item.path}
              className={bounceKey > 0 && !isMobile ? 'nav-bounce-item' : ''}
              style={bounceKey > 0 && !isMobile ? { animationDelay: `${idx * 50}ms` } : undefined}
            >
              <NavLink
                to={item.path}
                end={item.end}
                onClick={handleNavClick}
                title={!isMobile && !sidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `nav-item flex items-center gap-3 rounded-lg transition-all duration-300 cursor-pointer select-none
                  ${isMobile || sidebarOpen ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'}
                  ${
                    isActive
                      ? `bg-[#4880ff]/10 text-[#4880ff] nav-item-active`
                      : `${navTextInactive} ${navHover}`
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-[#4880ff]' : 'text-[#4379ee]'
                      }`}
                    />
                    {(isMobile || sidebarOpen) && (
                      <span
                        className="text-sm font-semibold tracking-[0.3px] whitespace-nowrap overflow-hidden"
                        style={{ fontVariationSettings: "'YTLC' 500, 'wdth' 100" }}
                      >
                        {item.label}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`border-t ${sidebarBorderColor} shrink-0 relative`}>
        <div
          className={`w-full flex items-center transition-colors duration-150 ${
            isMobile || sidebarOpen ? 'gap-3 p-4' : 'justify-center p-3'
          } ${navHover}`}
        >
          <div className="w-10 h-10 rounded-full bg-[#4880ff] text-white flex items-center justify-center shrink-0 font-bold overflow-hidden">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Аватар"
                className="w-full h-full object-cover"
              />
            ) : (
              userInitial
            )}
          </div>
          {(isMobile || sidebarOpen) && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-bold truncate ${profileNameColor}`}>
                  {user?.fullName || 'Пользователь'}
                </div>
                <div className={`text-xs ${profileRoleColor}`}>{roleLabel}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      <aside
        className={`
          ${sidebarBg} border-r ${sidebarBorderColor}
          hidden md:flex flex-col shrink-0 relative
          transition-[width] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
          ${sidebarOpen ? 'w-[240px]' : 'w-[72px]'}
        `}
      >
        {sidebarContent(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/50 sidebar-overlay-enter" />
          <aside
            className={`${sidebarBg} absolute left-0 top-0 bottom-0 w-[280px] flex flex-col shadow-2xl sidebar-slide-in`}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent(true)}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={`fixed top-3 left-3 z-[60] p-2 rounded-lg transition-all duration-200 btn-press md:hidden ${burgerColor} ${burgerHover}`}
          aria-label="Переключить боковое меню"
        >
          <Menu className="w-5 h-5" />
        </button>

        <main className="flex-1 overflow-auto">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
