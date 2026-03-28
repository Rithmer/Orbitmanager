import { useMemberUsersListQuery } from '@/app/hooks/use-member-users-list-query'
import { appQueryKeys } from '@/app/query'

export function useTeamMemberUsersQuery(enabled: boolean) {
  return useMemberUsersListQuery(appQueryKeys.teams.memberUsers, enabled)
}
