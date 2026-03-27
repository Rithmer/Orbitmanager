import type { TeamsThemeTokens } from '@/app/pages/Teams/hooks/useTeamsThemeTokens'

type TeamsLoadingStateProps = {
  tokens: TeamsThemeTokens
}

export function TeamsLoadingState({ tokens }: TeamsLoadingStateProps) {
  return (
    <div className={`${tokens.pageBg} min-h-full flex items-center justify-center`}>
      <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
