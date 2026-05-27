import { useEffect, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from '@/app/pages/Projects/constants'

function readPositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function buildPageQueryParams(currentParams: URLSearchParams, nextPage: number, nextSearch: string) {
  const nextParams = new URLSearchParams(currentParams)
  if (nextPage > 1) nextParams.set('page', String(nextPage))
  else nextParams.delete('page')
  if (nextSearch) nextParams.set('search', nextSearch)
  else nextParams.delete('search')
  return nextParams
}

export function useProjectsQueryState(searchParams: URLSearchParams, setSearchParams: (params: URLSearchParams, opts?: { replace?: boolean }) => void) {
  const page = readPositiveInt(searchParams.get('page'), 1)
  const searchTerm = searchParams.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(searchTerm)

  useEffect(() => { setSearchInput(searchTerm) }, [searchTerm])

  useEffect(() => {
    const normalizedSearch = searchInput.trim()
    const timeoutId = setTimeout(() => {
      if (normalizedSearch === searchTerm) return
      setSearchParams(buildPageQueryParams(searchParams, 1, normalizedSearch), { replace: true })
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [searchInput, searchParams, searchTerm, setSearchParams])

  const updatePage = (nextPage: number) => {
    setSearchParams(buildPageQueryParams(searchParams, nextPage, searchTerm))
  }

  const resetToFirstPage = () => {
    setSearchParams(buildPageQueryParams(searchParams, 1, searchTerm), { replace: true })
  }

  const clampPage = (totalPages: number) => {
    if (totalPages > 0 && page > totalPages) {
      setSearchParams(buildPageQueryParams(searchParams, totalPages, searchTerm), { replace: true })
    }
  }

  return { page, searchTerm, searchInput, setSearchInput, updatePage, resetToFirstPage, clampPage }
}
