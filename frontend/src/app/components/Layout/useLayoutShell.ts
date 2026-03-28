import { useCallback, useEffect, useRef, useState } from 'react'
import {
  readLastBoardProjectId,
  LAST_BOARD_PROJECT_CHANGED_EVENT,
} from '@/app/utils/lastBoardProjectStorage'

export function useLayoutShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [bounceKey, setBounceKey] = useState(0)
  const bounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [boardNavPath, setBoardNavPath] = useState(
    () => `/board/${readLastBoardProjectId() ?? 0}`,
  )

  useEffect(() => {
    const syncBoardNav = () => setBoardNavPath(`/board/${readLastBoardProjectId() ?? 0}`)
    window.addEventListener(LAST_BOARD_PROJECT_CHANGED_EVENT, syncBoardNav)
    return () => window.removeEventListener(LAST_BOARD_PROJECT_CHANGED_EVENT, syncBoardNav)
  }, [])

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev
      if (next) {
        setBounceKey((k) => k + 1)
        if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current)
        bounceTimerRef.current = setTimeout(() => setBounceKey(0), 800)
      }
      return next
    })
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    handler(mq)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), [])

  return {
    sidebarOpen,
    mobileOpen,
    bounceKey,
    boardNavPath,
    toggleSidebar,
    closeMobile,
    toggleMobile,
  }
}
