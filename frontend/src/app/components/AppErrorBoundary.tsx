import { Component, type ErrorInfo, type ReactNode } from 'react'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('AppErrorBoundary', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 text-center dark:bg-zinc-950">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Что-то пошло не так
          </h1>
          <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
            Обновите страницу. Если проблема повторяется, обратитесь к
            администратору.
          </p>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            onClick={() => window.location.reload()}
          >
            Обновить страницу
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
