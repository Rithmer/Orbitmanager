import { ErrorMessage } from '@/app/components/Modal'
import { useTeamsPageController } from '@/app/pages/Teams/hooks/useTeamsPageController'
import { TeamsCardsSection } from '@/app/pages/Teams/components/TeamsCardsSection'
import { TeamsLoadingState } from '@/app/pages/Teams/components/TeamsLoadingState'
import { TeamsPageHeader } from '@/app/pages/Teams/components/TeamsPageHeader'
import { TeamsPageModals } from '@/app/pages/Teams/components/TeamsPageModals'
import { TeamsSearchBar } from '@/app/pages/Teams/components/TeamsSearchBar'

export function TeamsPageContent() {
  const vm = useTeamsPageController()

  if (vm.loading) {
    return <TeamsLoadingState tokens={vm.tokens} />
  }

  return (
    <div className={`${vm.tokens.pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <TeamsPageHeader
        textPrimary={vm.tokens.textPrimary}
        textSecondary={vm.tokens.textSecondary}
        teamsCount={vm.teams.length}
        onCreate={vm.openCreateModal}
      />
      {vm.error ? <ErrorMessage message={vm.error} /> : null}
      <TeamsSearchBar
        value={vm.searchQuery}
        onChange={vm.setSearchQuery}
        textSecondary={vm.tokens.textSecondary}
        inputBg={vm.tokens.inputBg}
      />
      <TeamsCardsSection vm={vm} />
      <TeamsPageModals vm={vm} />
    </div>
  )
}
