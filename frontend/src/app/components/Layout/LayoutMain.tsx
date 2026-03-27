import { Outlet, useLocation } from 'react-router'
import { Menu } from 'lucide-react'
import { useTheme } from '@/app/context/useTheme'
import { useAuth } from '@/app/context/useAuth'
import { useAnalyticsSectionAccess } from '@/app/hooks/useAnalyticsSectionAccess'
import { useProjectsSectionAccess } from '@/app/hooks/useProjectsSectionAccess'
import { useRisksSectionAccess } from '@/app/hooks/useRisksSectionAccess'
import { AccountRole, ACCOUNT_ROLE_LABELS } from '@/app/types'
import { LayoutSidebarContent } from '@/app/components/Layout/LayoutSidebarContent'
import { useLayoutNavItems } from '@/app/components/Layout/useLayoutNavItems'
import { useLayoutShell } from '@/app/components/Layout/useLayoutShell'

export function Layout() {
  const {
    sidebarOpen,
    mobileOpen,
    bounceKey,
    boardNavPath,
    toggleSidebar,
    closeMobile,
    toggleMobile,
  } = useLayoutShell()

  const { isDark } = useTheme()
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  const { allowed: canSeeProjectsNav, isLoading: projectsNavLoading } = useProjectsSectionAccess()
  const { allowed: canSeeAnalyticsNav, isLoading: analyticsNavLoading } = useAnalyticsSectionAccess()
  const { allowed: canSeeRisksNav, isLoading: risksNavLoading } = useRisksSectionAccess()

  const navItems = useLayoutNavItems(
    boardNavPath,
    isAdmin,
    canSeeProjectsNav,
    projectsNavLoading,
    canSeeAnalyticsNav,
    analyticsNavLoading,
    canSeeRisksNav,
    risksNavLoading,
  )

  const sidebarBg = isDark ? 'bg-[#1b2431]' : 'bg-white'
  const sidebarBorderColor = isDark ? 'border-[#273142]' : 'border-[#e8e8e8]'
  const mainBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const burgerColor = isDark ? 'text-[#f4f3f2]' : 'text-[#1a202c]'
  const burgerHover = isDark ? 'hover:bg-[#313d4f]' : 'hover:bg-gray-100'

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || 'U'
  const roleLabel = user
    ? ACCOUNT_ROLE_LABELS[user.accountRole as AccountRole] || user.accountRole
    : ''

  const sidebarInner = (isMobile: boolean) => (
    <LayoutSidebarContent
      isMobile={isMobile}
      sidebarOpen={sidebarOpen}
      bounceKey={bounceKey}
      navItems={navItems}
      onLogoAreaClick={() => {
        if (isMobile) closeMobile()
        else toggleSidebar()
      }}
      onNavClick={closeMobile}
      onMobileDrawerClose={closeMobile}
      user={user ?? null}
      userInitial={userInitial}
      roleLabel={roleLabel}
    />
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
        {sidebarInner(false)}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={closeMobile}>
          <div className="absolute inset-0 bg-black/50 sidebar-overlay-enter" />
          <aside
            className={`${sidebarBg} absolute left-0 top-0 bottom-0 w-[280px] flex flex-col shadow-2xl sidebar-slide-in`}
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarInner(true)}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <button
          onClick={toggleMobile}
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
