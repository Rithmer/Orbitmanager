import { getPageSurfaceTokens } from '@/app/hooks/pageSurfaceTokens'

export function useCalendarThemeTokens(isDark: boolean) {
  const base = getPageSurfaceTokens(isDark)
  return {
    ...base,
    dayCellBorder: isDark ? 'border-[#313d4f]' : 'border-gray-100',
    dayCellHover: isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50',
    dayHeaderBg: isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]',
    modalBg: base.cardBg,
  }
}
