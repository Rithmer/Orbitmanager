import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router'
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
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { AccountRole, ACCOUNT_ROLE_LABELS } from '../types'

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

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

  return (
    <div className={`flex h-screen overflow-hidden ${mainBg}`}>
      <aside
        className={`
          ${sidebarBg} border-r ${sidebarBorderColor}
          flex flex-col shrink-0 relative
          transition-[width] duration-300 ease-in-out
          ${sidebarOpen ? 'w-[240px]' : 'w-[72px]'}
        `}
      >
        <div
          className={`
            h-[70px] flex items-center border-b ${sidebarBorderColor}
            ${sidebarOpen ? 'px-6' : 'justify-center px-0'}
            transition-all duration-300 shrink-0
          `}
        >
          {sidebarOpen ? (
            <span className="text-xl font-extrabold select-none">
              <span className="text-[#4880ff]">Orbit</span>
              <span className={logoTextColor}>Manager</span>
            </span>
          ) : (
            <span className="text-xl font-extrabold text-[#4880ff] select-none">O</span>
          )}
        </div>

        <nav className="flex-1 py-5 overflow-y-auto overflow-x-hidden">
          <ul className={`space-y-1 ${sidebarOpen ? 'px-3' : 'px-2'}`}>
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  title={!sidebarOpen ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg transition-all duration-150 cursor-pointer select-none
                    ${sidebarOpen ? 'px-3 py-2.5' : 'justify-center px-0 py-2.5'}
                    ${
                      isActive
                        ? 'bg-[#4880ff]/10 text-[#4880ff]'
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
                      {sidebarOpen && (
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
              sidebarOpen ? 'gap-3 p-4' : 'justify-center p-3'
            } ${navHover}`}
          >
            <div className="w-10 h-10 rounded-full bg-[#4880ff] text-white flex items-center justify-center shrink-0 font-bold">
              {userInitial}
            </div>
            {sidebarOpen && (
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
              } border rounded-xl shadow-xl overflow-hidden z-50`}
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
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className={`
            ${topBarBg} border-b ${topBarBorder}
            h-[70px] flex items-center justify-between px-6 shrink-0
          `}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors duration-150 ${burgerColor} ${burgerHover}`}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-150 ${themeIconColor} ${themeIconHover}`}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
