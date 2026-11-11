import { API_URL } from './api'

export interface SessionInfo {
  userId: string
  role: string
  institutionId: string | null
}

let cached: Promise<SessionInfo | null> | null = null

const fetchSession = async (): Promise<SessionInfo | null> => {
  const response = await fetch(`${API_URL}/auth/me`, { method: 'GET', credentials: 'include' })
  if (!response.ok) return null

  const json = await response.json()
  const data = json?.data
  if (!data) return null

  return {
    userId: String(data.id_usuario),
    role: String(data.nombre_rol ?? '').trim().toUpperCase(),
    institutionId: data.id_institucion != null ? String(data.id_institucion) : null,
  }
}

// Una sola consulta a GET /auth/me compartida por todos los servicios.
// No se guardan resultados fallidos para poder reintentar.
export const sessionService = {
  async get(): Promise<SessionInfo | null> {
    if (!cached) {
      const request = fetchSession().catch(() => null)
      cached = request
      const session = await request
      if (!session && cached === request) cached = null
      return session
    }
    return cached
  },

  async getInstitutionId(): Promise<string | null> {
    return (await this.get())?.institutionId ?? null
  },

  async isOperativo(): Promise<boolean> {
    return (await this.get())?.role === 'OPERATIVO'
  },

  clear(): void {
    cached = null
  },
}
