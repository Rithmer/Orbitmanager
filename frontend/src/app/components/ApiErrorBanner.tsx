import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { APP_API_ERROR_EVENT } from '@/app/api/api-error-dispatch'

type ApiErrorDetail = { message: string }

export function ApiErrorBanner() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')

  const onEvent = useCallback((e: Event) => {
    const ce = e as CustomEvent<ApiErrorDetail>
    if (ce.detail?.message) {
      setMessage(ce.detail.message)
      setOpen(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener(APP_API_ERROR_EVENT, onEvent)
    return () => window.removeEventListener(APP_API_ERROR_EVENT, onEvent)
  }, [onEvent])

  if (!open) {
    return null
  }

  return (
    <div
      role="alert"
      className="fixed left-0 right-0 top-0 z-[200] flex items-start justify-center px-3 pt-3"
    >
      <div className="flex max-w-lg items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-lg dark:border-red-900/60 dark:bg-red-950/90 dark:text-red-100">
        <span className="flex-1">{message}</span>
        <button
          type="button"
          aria-label="Закрыть уведомление"
          className="rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/50"
          onClick={() => setOpen(false)}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
