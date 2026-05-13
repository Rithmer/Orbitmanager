import { useMemo } from 'react'

export function useAuthCardSurfaceTokens(isDark: boolean) {
  return useMemo(
    () => ({
      pageBg: isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]',
      cardBg: isDark ? 'bg-[#273142]' : 'bg-white',
      cardBorder: isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]',
      textPrimary: isDark ? 'text-[#f4f3f2]' : 'text-[#202224]',
      textSecondary: isDark ? 'text-[#94a3b8]' : 'text-[#737373]',
      inputBg: isDark ? 'bg-[#1c2534] border-[#313d4f]' : 'bg-gray-50 border-gray-200',
      inputText: isDark ? 'text-[#f4f3f2]' : 'text-[#202224]',
    }),
    [isDark],
  )
}
