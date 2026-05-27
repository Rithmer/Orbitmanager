import type { TeamsPageViewModel } from '@/app/pages/Teams/hooks/useTeamsPageController'

export type TeamsSearchBarProps = {
  model: Pick<TeamsPageViewModel, 'ui' | 'search'>
}
