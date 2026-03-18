import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import {
  LayoutGrid,
  FolderOpen,
  ClipboardList,
  Users,
  CalendarDays,
  PieChart,
  Settings2,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'
import { AccountRole, ACCOUNT_ROLE_LABELS } from '../types'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [bounceKey, setBounceKey] = useState(0)
  const bounceTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
    { path: '/projects', label: 'Проекты', icon: FolderOpen, end: false },
    { path: '/board/0', label: 'Задачи', icon: ClipboardList, end: false },
    { path: '/teams', label: 'Команды', icon: Users, end: false },
    { path: '/calendar', label: 'Календарь', icon: CalendarDays, end: false },
    { path: '/reports', label: 'Аналитика', icon: PieChart, end: false },
    { path: '/settings', label: 'Настройки', icon: Settings2, end: false },
    ...(isAdmin
      ? [{ path: '/admin', label: 'Админ-панель', icon: ShieldCheck, end: false }]
      : []),
  ]

  const sidebarBg = isDark ? 'bg-[#1b2431]' : 'bg-white'
  const sidebarBorderColor = isDark ? 'border-[#273142]' : 'border-[#e8e8e8]'
  const topBarBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const topBarBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const mainBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const logoTextColor = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const navTextInactive = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const navHover = isDark ? 'hover:bg-[#273142]' : 'hover:bg-[#f0f4ff]'
  const profileNameColor = isDark ? 'text-[#f4f3f2]' : 'text-[#404040]'
  const profileRoleColor = isDark ? 'text-[#94a3b8]' : 'text-[#565656]'
  const chevronColor = isDark ? 'text-[#f4f3f2]' : 'text-[#565656]'
  const burgerColor = isDark ? 'text-[#f4f3f2]' : 'text-[#1a202c]'
  const burgerHover = isDark ? 'hover:bg-[#313d4f]' : 'hover:bg-gray-100'
  const themeIconColor = isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'
  const themeIconHover = isDark ? 'hover:bg-[#313d4f]' : 'hover:bg-gray-100'

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || 'U'
  const roleLabel = user ? ACCOUNT_ROLE_LABELS[user.accountRole as AccountRole] || user.accountRole : ''

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

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
        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={`w-full flex items-center transition-colors duration-150 ${
            isMobile || sidebarOpen ? 'gap-3 p-4' : 'justify-center p-3'
          } ${navHover}`}
        >
          <div className="w-10 h-10 rounded-full bg-[#4880ff] text-white flex items-center justify-center shrink-0 font-bold">
            {userInitial}
          </div>
          {(isMobile || sidebarOpen) && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <div className={`text-sm font-bold truncate ${profileNameColor}`}>
                  {user?.fullName || 'Пользователь'}
                </div>
                <div className={`text-xs ${profileRoleColor}`}>{roleLabel}</div>
              </div>
              <ChevronDown
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${chevronColor} ${
                  profileMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </>
          )}
        </button>

        {profileMenuOpen && (
          <div
            className={`absolute bottom-full left-0 right-0 mb-1 mx-2 ${
              isDark ? 'bg-[#273142] border-[#313d4f]' : 'bg-white border-[#e8e8e8]'
            } border rounded-xl shadow-xl overflow-hidden z-50 dropdown-up-enter`}
          >
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-red-500 ${
                isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
              } transition-colors`}
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        )}
      </div>
    </>
  )

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      {/* Desktop Sidebar */}
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

      {/* Mobile Sidebar Overlay */}
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className={`
            ${topBarBg} border-b ${topBarBorder}
            h-[60px] md:h-[70px] flex items-center justify-between px-4 md:px-6 shrink-0
          `}
        >
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`p-2 rounded-lg transition-all duration-200 btn-press md:hidden ${burgerColor} ${burgerHover}`}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-all duration-200 icon-btn-hover ${themeIconColor} ${themeIconHover}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
