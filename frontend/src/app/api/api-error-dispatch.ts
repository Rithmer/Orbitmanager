import { ApiError } from '@/app/api/client'

export const APP_API_ERROR_EVENT = 'app-api-error'

type ApiErrorDetail = { message: string }

function extractMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message || 'Ошибка запроса'
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return 'Произошла ошибка'
}

export function dispatchApiError(error: unknown) {
  const message = extractMessage(error)
  window.dispatchEvent(
    new CustomEvent<ApiErrorDetail>(APP_API_ERROR_EVENT, {
      detail: { message },
    }),
  )
}
