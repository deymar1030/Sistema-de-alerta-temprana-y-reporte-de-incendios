export const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null
  try {
    const session = window.localStorage.getItem('alerta-mobile-session')
    if (!session) return null
    const parsed = JSON.parse(session)
    return parsed?.token ?? null
  } catch {
    return null
  }
}

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const token = getStoredToken()

  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.body && !(init.headers instanceof Headers) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
    },
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      payload?.message ??
      payload?.error ??
      payload?.detail ??
      `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return (payload?.data ?? payload ?? null) as T
}
