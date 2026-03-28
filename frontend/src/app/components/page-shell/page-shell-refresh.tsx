import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTheme } from '@/app/context/useTheme'

export interface RefreshBadgeProps {
  isRefreshing?: boolean
  label?: string
  className?: string
}

export function RefreshBadge({
  isRefreshing = false,
  label = 'Обновление данных',
  className = '',
}: RefreshBadgeProps) {
  const { isDark } = useTheme()

  if (!isRefreshing) {
    return null
  }

  const badgeBg = isDark ? 'bg-[#1e2a3a]/95 border-[#313d4f]' : 'bg-white/95 border-black/10'
  const badgeText = isDark ? 'text-[#94a3b8]' : 'text-[#565656]'

  return (
    <div
      className={`fade-in-down inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${badgeBg} ${badgeText} ${className}`.trim()}
    >
      <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#4880ff]" />
      <span>{label}</span>
    </div>
  )
}

export interface PageRefreshOverlayProps {
  show?: boolean
  label?: string
  className?: string
  children: ReactNode
}

export function PageRefreshOverlay({
  show = false,
  label = 'Обновление данных',
  className = '',
  children,
}: PageRefreshOverlayProps) {
  return (
    <div className={`page-refresh-shell relative overflow-hidden ${className}`.trim()}>
      <div className={`transition-opacity duration-300 ${show ? 'opacity-75' : 'opacity-100'}`}>
        {children}
      </div>
      {show ? (
        <div className="page-refresh-overlay pointer-events-none">
          <div className="absolute right-3 top-3">
            <RefreshBadge isRefreshing label={label} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
