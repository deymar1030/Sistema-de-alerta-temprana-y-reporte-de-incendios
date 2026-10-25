import { apiFetch } from './http'

/** Contrato del documento 05: propiedades opcionales según el origen de la alerta. */
export interface InstitutionDelivery {
  id_institucion: string
  nombre: string
  estado: 'ENVIADA' | 'RECIBIDA' | 'ATENDIDA' | 'CERRADA' | string
  fecha_envio: string
  fecha_actualizacion: string | null
}

export interface BackendAlert {
  id_alerta: string
  fecha: string
  hora: string
  estado: 'EN_EVALUACION' | 'CONFIRMADA' | 'ATENDIDA' | 'DESCARTADA' | 'CERRADA' | string
  puntaje: number | null
  clasificacion: string | null
  fecha_confirmacion?: string | null
  fecha_cierre?: string | null
  descripcion?: string | null
  predio?: { id_predio: string; nombre: string; latitud: number | null; longitud: number | null } | null
  lecturas?: Array<{ id_lectura: string; tipo_variable: string; valor: number }>
  reporte_origen?: {
    id_reporte_u?: string
    descripcion?: string
    foto_url?: string | null
    indicador?: string | null
    latitud?: number | null
    longitud?: number | null
    ubicacion_tipo?: string | null
  } | null
  instituciones_notificadas?: InstitutionDelivery[]
}

function assertList(value: unknown): BackendAlert[] {
  if (!Array.isArray(value)) {
    throw new Error('Respuesta inesperada: /alertas debe devolver una lista.')
  }
  return value as BackendAlert[]
}

export const backendAlertsService = {
  async list(): Promise<BackendAlert[]> {
    return assertList(await apiFetch('/alertas'))
  },
  async byInstitution(institutionId: string): Promise<BackendAlert[]> {
    return assertList(await apiFetch(`/alertas?id_institucion=${encodeURIComponent(institutionId)}`))
  },
  async active(): Promise<BackendAlert[]> {
    return assertList(await apiFetch('/alertas/activas'))
  },
  async detail(id: string): Promise<BackendAlert> {
    const detail = await apiFetch<BackendAlert>(`/alertas/${encodeURIComponent(id)}`)
    if (!detail || detail.id_alerta == null) throw new Error('El backend devolvió un detalle de alerta inválido.')
    return detail
  },
}
