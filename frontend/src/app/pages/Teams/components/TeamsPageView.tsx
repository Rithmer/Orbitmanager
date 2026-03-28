import { ErrorMessage } from '@/app/components/Modal'
import type { TeamsPageViewModel } from '@/app/pages/Teams/hooks/useTeamsPageController'
import { TeamsCardsSection } from '@/app/pages/Teams/components/TeamsCards'
import { TeamsLoadingState } from '@/app/pages/Teams/components/TeamsLoadingState'
import { TeamsPageHeader } from '@/app/pages/Teams/components/TeamsPageHeader'
import { TeamsPageModals } from '@/app/pages/Teams/components/TeamsModals'
import { TeamsSearchBar } from '@/app/pages/Teams/components/TeamsSearchBar'

type TeamsPageViewProps = {
  model: TeamsPageViewModel
}

export function TeamsPageView({ model }: TeamsPageViewProps) {
  if (model.data.loading) {
    return <TeamsLoadingState ui={model.ui} />
  }

  return (
    <div className={`${model.ui.pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <TeamsPageHeader model={model} />
      {model.data.error ? <ErrorMessage message={model.data.error} /> : null}
      <TeamsSearchBar model={model} />
      <TeamsCardsSection model={model} />
      <TeamsPageModals model={model} />
    </div>
  )
}
