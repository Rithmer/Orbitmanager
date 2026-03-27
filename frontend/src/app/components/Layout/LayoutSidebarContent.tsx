import { NavLink } from 'react-router'
import { X } from 'lucide-react'
import { useTheme } from '@/app/context/useTheme'
import type { User } from '@/app/types'
import type { LayoutNavItem } from '@/app/components/Layout/useLayoutNavItems'

type LayoutSidebarContentProps = {
  isMobile: boolean
  sidebarOpen: boolean
  bounceKey: number
  navItems: LayoutNavItem[]
  onLogoAreaClick: () => void
  onNavClick: () => void
  onMobileDrawerClose: () => void
  user: User | null
  userInitial: string
  roleLabel: string
}

function logoLetters(text: string, color: string, startDelay: number, bounceKey: number) {
  if (bounceKey > 0) {
    return text.split('').map((ch, i) => (
      <span
        key={`${bounceKey}-${i}`}
        className={`${color} letter-bounce`}
        style={{ animationDelay: `${startDelay + i * 30}ms` }}
      >
        {ch}
      </span>
    ))
  }
  return <span className={color}>{text}</span>
}

export function LayoutSidebarContent({
  isMobile,
  sidebarOpen,
  bounceKey,
  navItems,
  onLogoAreaClick,
  onNavClick,
  onMobileDrawerClose,
  user,
  userInitial,
  roleLabel,
}: LayoutSidebarContentProps) {
  const { isDark } = useTheme()
  const sidebarBorderColor = isDark ? 'border-[#273142]' : 'border-[#e8e8e8]'
  const logoTextColor = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const navTextInactive = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const navHover = isDark ? 'hover:bg-[#273142]' : 'hover:bg-[#f0f4ff]'
  const profileNameColor = isDark ? 'text-[#f4f3f2]' : 'text-[#404040]'
  const profileRoleColor = isDark ? 'text-[#94a3b8]' : 'text-[#565656]'
  const burgerColor = isDark ? 'text-[#f4f3f2]' : 'text-[#1a202c]'
  const burgerHover = isDark ? 'hover:bg-[#313d4f]' : 'hover:bg-gray-100'

  return (
    <>
      <div
        className={`
          h-[70px] flex items-center border-b ${sidebarBorderColor}
          ${isMobile || sidebarOpen ? 'px-6 justify-between' : 'justify-center px-0'}
          transition-all duration-300 shrink-0
        `}
      >
        <div
          onClick={onLogoAreaClick}
          className="text-xl font-extrabold select-none cursor-pointer"
        >
          {isMobile || sidebarOpen ? (
            <>
              {logoLetters('Orbit', 'text-[#4880ff]', 0, bounceKey)}
              {logoLetters('Manager', logoTextColor, 150, bounceKey)}
            </>
          ) : (
            <span className="text-[#4880ff]">O</span>
          )}
        </div>
        {isMobile && (
          <button
            onClick={onMobileDrawerClose}
            className={`p-2 rounded-lg ${burgerColor} ${burgerHover}`}
          >
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
                onClick={onNavClick}
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
                        className="text-sm font-semibold tracking-[0.3px] truncate"
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
            <div className="flex-1 min-w-0 text-left">
              <div className={`text-sm font-bold truncate ${profileNameColor}`}>
                {user?.fullName || 'Пользователь'}
              </div>
              <div className={`text-xs ${profileRoleColor}`}>{roleLabel}</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
