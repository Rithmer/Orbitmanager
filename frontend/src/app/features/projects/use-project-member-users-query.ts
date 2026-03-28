import { appQueryKeys } from '@/app/query'
import { useMemberUsersListQuery } from '@/app/hooks/use-member-users-list-query'

export function useProjectMemberUsersQuery(enabled: boolean) {
  return useMemberUsersListQuery(appQueryKeys.projects.memberUsers, enabled)
}
