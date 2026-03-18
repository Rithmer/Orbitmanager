const API_BASE = '/api'

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
    localStorage.setItem('accessToken', access)
    localStorage.setItem('refreshToken', refresh)
  }

  loadTokens() {
    this.accessToken = localStorage.getItem('accessToken')
    this.refreshToken = localStorage.getItem('refreshToken')
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  }

  getAccessToken() {
    return this.accessToken
  }

  isAuthenticated() {
    return !!this.accessToken
  }

  private async doRefresh(): Promise<boolean> {
    if (!this.refreshToken) return false
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      })
      if (!res.ok) return false
      const data = await res.json()
      this.setTokens(data.accessToken, data.refreshToken)
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

    let res = await fetch(`${API_BASE}${path}`, { ...options, headers })

    if (res.status === 401 && this.refreshToken) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.doRefresh()
      }
      const refreshed = await this.refreshPromise
      this.refreshPromise = null

      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`
        res = await fetch(`${API_BASE}${path}`, { ...options, headers })
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

  get<T>(path: string) {
    return this.request<T>(path)
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  }

  delete<T>(path: string) {
    return this.request<T>(path, { method: 'DELETE' })
  }
}

export const api = new ApiClient()

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== '',
  )
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}
