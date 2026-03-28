import { keepPreviousData, useQuery, type QueryKey } from '@tanstack/react-query'
import { usersApi } from '@/app/api/users'

const memberPickerUserListParams = { page: 1, limit: 1000, sort: 'fullName' as const }

export function useMemberUsersListQuery(queryKey: QueryKey, enabled: boolean) {
  return useQuery({
    queryKey,
    queryFn: ({ signal }) => usersApi.list(memberPickerUserListParams, { signal }),
    enabled,
    placeholderData: keepPreviousData,
  })
}
