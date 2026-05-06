import type { TeamsPageViewModel } from '@/app/pages/Teams/hooks/useTeamsPageController'

export type TeamsPageHeaderProps = {
  model: Pick<TeamsPageViewModel, 'ui' | 'data' | 'handlers'>
}
