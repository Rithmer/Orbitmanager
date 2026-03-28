import type { ReactNode } from 'react'
import { useTheme } from '@/app/context/useTheme'
import { PageRefreshOverlay } from '@/app/components/page-shell/page-shell-refresh'

export interface PageShellProps {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className = '',
}: PageShellProps) {
  const { isDark } = useTheme()
  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8 page-load-stagger ${className}`.trim()}>
      <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>{title}</h1>
          {description && <p className={`mt-1 text-sm ${textSecondary}`}>{description}</p>}
        </div>
        {actions ? <div className="self-start sm:self-auto">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}

export interface PageSectionProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
  headerSlot?: ReactNode
  isRefreshing?: boolean
  refreshLabel?: string
}

export function PageSection({
  title,
  description,
  children,
  className = '',
  headerSlot,
  isRefreshing = false,
  refreshLabel = 'Обновление данных',
}: PageSectionProps) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  const section = (
    <section className={`${cardBg} border ${cardBorder} rounded-xl p-6 ${className}`.trim()}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={`font-bold ${textPrimary}`}>{title}</h2>
          {description && <p className={`mt-1 text-sm ${textSecondary}`}>{description}</p>}
        </div>
        {headerSlot ? <div className="self-start sm:self-auto">{headerSlot}</div> : null}
      </div>
      {children}
    </section>
  )

  if (!isRefreshing) {
    return section
  }

  return (
    <PageRefreshOverlay show={isRefreshing} label={refreshLabel}>
      {section}
    </PageRefreshOverlay>
  )
}
