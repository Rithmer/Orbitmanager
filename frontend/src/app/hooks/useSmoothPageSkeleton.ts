import { useEffect, useState } from 'react'

export function useSmoothPageSkeleton(
  isInitialLoading: boolean,
  minDurationMs: number = 400,
) {
  const [delayElapsed, setDelayElapsed] = useState(!isInitialLoading)

  useEffect(() => {
    if (isInitialLoading) {
      return
    }

    const timeoutId = setTimeout(() => {
      setDelayElapsed(true)
    }, minDurationMs)

    return () => clearTimeout(timeoutId)
  }, [isInitialLoading, minDurationMs])

  return isInitialLoading || !delayElapsed
}
