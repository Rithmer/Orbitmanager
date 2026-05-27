import { useDeferredValue, useState } from 'react'
import { USERS_PAGE_SIZE } from '@/app/pages/Admin/constants'

export function useUsersPanelListState() {
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [page, setPage] = useState(1)
  const limit = USERS_PAGE_SIZE

  return { searchTerm, setSearchTerm, deferredSearchTerm, page, setPage, limit }
}
