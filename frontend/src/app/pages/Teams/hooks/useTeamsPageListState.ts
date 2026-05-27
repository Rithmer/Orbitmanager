import { useState } from 'react'

export function useTeamsPageListState() {
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  return { searchQuery, setSearchQuery, openMenuId, setOpenMenuId }
}
