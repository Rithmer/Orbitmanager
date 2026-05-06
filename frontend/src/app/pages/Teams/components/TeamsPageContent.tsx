import { useTeamsPageController } from '@/app/pages/Teams/hooks/useTeamsPageController'
import { TeamsPageView } from '@/app/pages/Teams/components/TeamsPageView'

export function TeamsPageContent() {
  const model = useTeamsPageController()
  return <TeamsPageView model={model} />
}
