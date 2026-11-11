import { apiFetch } from './http'

/** Contratos de solo lectura: las tablas de auditoria se escriben en el backend. */
export interface SystemAuditEntry {
  id_auditoria: string
  evento: string
  fecha_hora: string
  detalle: string | null
}

export interface UserAuditEntry {
  id_auditoriau: string
  id_usuario: string
  accion: string
  detalle: string | null
  fecha_hora: string
  ip_origen: string | null
}

export interface SystemAuditFilters {
  evento?: string
  desde?: string
  hasta?: string
}

export interface UserAuditFilters {
  id_usuario?: string
  accion?: string
  desde?: string
  hasta?: string
}

function queryString(filters: SystemAuditFilters | UserAuditFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    const cleaned = value?.trim()
    if (cleaned) params.set(key, cleaned)
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

function asArray(value: unknown, label: string): Record<string, unknown>[] {
  if (!Array.isArray(value) || !value.every(item => item && typeof item === 'object' && !Array.isArray(item))) {
    throw new Error(`La API devolvio un formato invalido para ${label}.`)
  }
  return value as Record<string, unknown>[]
}

export const auditService = {
  async getSystemEvents(filters: SystemAuditFilters = {}): Promise<SystemAuditEntry[]> {
    const rows = asArray(await apiFetch<unknown>(`/auditoria${queryString(filters)}`), 'auditoria')
    return rows.map(row => ({
      id_auditoria: String(row.id_auditoria ?? ''),
      evento: String(row.evento ?? ''),
      fecha_hora: String(row.fecha_hora ?? ''),
      detalle: row.detalle == null ? null : String(row.detalle),
    }))
  },

  async getUserEvents(filters: UserAuditFilters = {}): Promise<UserAuditEntry[]> {
    const rows = asArray(await apiFetch<unknown>(`/auditoria/usuarios${queryString(filters)}`), 'auditoria de usuarios')
    return rows.map(row => ({
      id_auditoriau: String(row.id_auditoriau ?? ''),
      id_usuario: String(row.id_usuario ?? ''),
      accion: String(row.accion ?? ''),
      detalle: row.detalle == null ? null : String(row.detalle),
      fecha_hora: String(row.fecha_hora ?? ''),
      ip_origen: row.ip_origen == null ? null : String(row.ip_origen),
    }))
  },
}
