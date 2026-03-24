const API_BASE = '/api'
const AUTH_STORAGE_MODE = import.meta.env.VITE_AUTH_STORAGE_MODE ?? 'session'

type AuthStorageMode = 'session' | 'local' | 'memory'

function resolveAuthStorageMode(): AuthStorageMode {
  if (AUTH_STORAGE_MODE === 'local') {
    return 'local'
  }
  if (AUTH_STORAGE_MODE === 'memory') {
    return 'memory'
  }
  return 'session'
}

const authStorageMode = resolveAuthStorageMode()

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null
  }
  if (authStorageMode === 'local') {
    return window.localStorage
  }
  if (authStorageMode === 'session') {
    return window.sessionStorage
  }
  return null
}

export interface ApiRequestOptions {
  signal?: AbortSignal
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown[],
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private refreshPromise: Promise<boolean> | null = null
  private onAuthExpired?: () => void

  setOnAuthExpired(cb: () => void) {
    this.onAuthExpired = cb
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access
    this.refreshToken = refresh
    const storage = getStorage()
    storage?.setItem('accessToken', access)
    storage?.setItem('refreshToken', refresh)
  }

  loadTokens() {
    const storage = getStorage()
    this.accessToken = storage?.getItem('accessToken') ?? null
    this.refreshToken = storage?.getItem('refreshToken') ?? null
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    const storage = getStorage()
    storage?.removeItem('accessToken')
    storage?.removeItem('refreshToken')
  }

  getAccessToken() {
    return this.accessToken
  }

  getRefreshToken() {
    return this.refreshToken
  }

  isAuthenticated() {
    return !!this.accessToken
  }

  private async doRefresh(): Promise<boolean> {
    const canRefreshWithCookieOnly = authStorageMode === 'memory'
    if (!this.refreshToken && !canRefreshWithCookieOnly) return false
    try {
      const refreshBody = this.refreshToken ? { refreshToken: this.refreshToken } : undefined
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: refreshBody ? JSON.stringify(refreshBody) : undefined,
        credentials: 'include',
      })
      if (!res.ok) return false
      const data = await res.json()
      if (data.accessToken && data.refreshToken) {
        this.setTokens(data.accessToken, data.refreshToken)
      }
      return true
    } catch {
      return false
    }
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' })

    if (res.status === 401 && this.refreshToken) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.doRefresh().finally(() => {
          this.refreshPromise = null
        })
      }
      const refreshed = await this.refreshPromise

      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`
        res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' })
      } else {
        this.clearTokens()
        this.onAuthExpired?.()
        throw new ApiError(401, 'Сессия истекла')
      }
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Ошибка запроса' }))
      throw new ApiError(res.status, error.message || 'Ошибка запроса', error.details)
    }

    if (res.status === 204) return undefined as T
    const text = await res.text()
    return text ? JSON.parse(text) : (undefined as T)
  }

  get<T>(path: string, options: ApiRequestOptions = {}) {
    return this.request<T>(path, options)
  }

  post<T>(path: string, body?: unknown, options: ApiRequestOptions = {}) {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(path: string, body: unknown, options: ApiRequestOptions = {}) {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  delete<T>(path: string, options: ApiRequestOptions = {}) {
    return this.request<T>(path, { ...options, method: 'DELETE' })
  }
}

export const api = new ApiClient()

export function isAbortError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: string }).name === 'AbortError'
  )
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  )
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}
