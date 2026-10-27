/** Cliente REST móvil: no inventar ni enviar Bearer demo-token; el backend usa sid. */
export const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

export async function apiFetch<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(init.headers)
  if (!headers.has('Accept')) headers.set('Accept', 'application/json')
  if (init.body != null && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, { ...init, credentials: 'include', headers })
  const raw = await response.text()
  let payload: any = null
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw)
    } catch {
      throw new Error(`El servidor devolvió una respuesta no JSON (HTTP ${response.status}).`)
    }
  }

  if (!response.ok || payload?.success === false) {
    const candidate = payload?.error ?? payload?.message ?? payload?.detail
    const message = typeof candidate === 'string'
      ? candidate
      : (typeof candidate?.message === 'string' ? candidate.message : `Solicitud rechazada (HTTP ${response.status}).`)
    throw new Error(message)
  }

  return (payload?.data ?? payload ?? null) as T
}
