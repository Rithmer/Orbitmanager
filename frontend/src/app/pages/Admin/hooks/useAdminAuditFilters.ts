import { useState } from 'react'

export function useAdminAuditFilters(presetUserId: number | null) {
  const [page, setPage] = useState(1)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [filterUserId, setFilterUserId] = useState(() =>
    presetUserId === null ? '' : String(presetUserId),
  )

  const parsedUserId = (() => {
    const trimmed = filterUserId.trim()
    if (!trimmed) return undefined
    const value = Number.parseInt(trimmed, 10)
    return Number.isFinite(value) ? value : undefined
  })()

  return {
    page,
    setPage,
    filterAction,
    setFilterAction,
    filterEntity,
    setFilterEntity,
    filterUserId,
    setFilterUserId,
    parsedUserId,
  }
}
