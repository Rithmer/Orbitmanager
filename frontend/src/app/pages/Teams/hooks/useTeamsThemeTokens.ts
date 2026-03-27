import { getPageSurfaceTokens } from '@/app/hooks/pageSurfaceTokens'

export function useTeamsThemeTokens(isDark: boolean) {
  const base = getPageSurfaceTokens(isDark)
  return {
    ...base,
    inputBg: isDark
      ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]'
      : 'bg-white border-[#e8e8e8] text-[#202224]',
    avatarBg: isDark ? 'bg-[#313d4f]' : 'bg-gray-100',
  }
}

export type TeamsThemeTokens = ReturnType<typeof useTeamsThemeTokens>
