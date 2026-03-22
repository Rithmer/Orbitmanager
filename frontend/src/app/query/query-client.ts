import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'

function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  if (error instanceof ApiError) {
    return error.status
  }

  const response = 'response' in error ? (error as { response?: { status?: number } }).response : undefined
  if (typeof response?.status === 'number') {
    return response.status
  }

  if ('cause' in error && error.cause !== undefined) {
    return getHttpStatus(error.cause)
  }

  return undefined
}

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = getHttpStatus(error)

  if (typeof status === 'number' && status < 500) {
    return false
  }

  return failureCount < 2
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: shouldRetryQuery,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const appQueryClient = createAppQueryClient()
