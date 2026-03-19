import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { usersApi } from '../../api/users'

export function useProjectMemberUsersQuery(enabled: boolean) {
  return useQuery({
    queryKey: ['projects', 'member-users'] as const,
    queryFn: ({ signal }) =>
      usersApi.list({ page: 1, limit: 1000, sort: 'fullName' }, { signal }),
    enabled,
    placeholderData: keepPreviousData,
  })
}
