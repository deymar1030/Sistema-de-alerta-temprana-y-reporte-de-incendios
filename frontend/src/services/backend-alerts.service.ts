
import { apiFetch } from './http'

// Instituciones notificadas sobre una alerta.
export interface InstitutionDelivery {
  id_institucion: string
  nombre: string
  estado:
    | 'ENVIADA'
    | 'RECIBIDA'
    | 'ATENDIDA'
    | 'CERRADA'
    | string
  fecha_envio: string
  fecha_actualizacion: string | null
}

// Ubicación geográfica de una alerta.
// Una alerta puede tener varias ubicaciones.
export interface MapAlertLocation {
  origen: string
  id_predio?: number | string | null
  nombre?: string | null
  latitud: number | string | null
  longitud: number | string | null
}

// Contrato del nuevo endpoint GET /api/alertas/mapa.
export interface MapAlert {
  id_alerta: number | string
  estado: string
  clasificacion: string | null
  fecha: string
  hora: string
  ubicaciones: MapAlertLocation[]
}

// Contrato general de alertas.
export interface BackendAlert {
  id_alerta: string
  fecha: string
  hora: string

  estado:
    | 'EN_EVALUACION'
    | 'CONFIRMADA'
    | 'ATENDIDA'
    | 'DESCARTADA'
    | 'CERRADA'
    | string

  puntaje: number | null
  clasificacion: string | null

  fecha_confirmacion?: string | null
  fecha_cierre?: string | null
  descripcion?: string | null

  predio?: {
    id_predio: string
    nombre: string
    latitud: number | null
    longitud: number | null
  } | null

  lecturas?: Array<{
    id_lectura: string
    tipo_variable: string
    valor: number
  }>

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

// Validar que el servidor devuelva una lista.
function assertAlertList(value: unknown): BackendAlert[] {
  if (!Array.isArray(value)) {
    throw new Error(
      'El backend debe devolver una lista de alertas.'
    )
  }

  return value as BackendAlert[]
}

// Validar el nuevo contrato de ubicaciones.
function assertMapAlerts(value: unknown): MapAlert[] {
  if (!Array.isArray(value)) {
    throw new Error(
      'El endpoint /alertas/mapa debe devolver una lista.'
    )
  }

  return value.map((item: unknown) => {
    if (!item || typeof item !== 'object') {
      throw new Error('El backend devolvió una alerta inválida.')
    }

    const alert = item as Partial<MapAlert>

    if (
      alert.id_alerta == null ||
      !Array.isArray(alert.ubicaciones)
    ) {
      throw new Error(
        'Una alerta no contiene un ID o una lista de ubicaciones válida.'
      )
    }

    return alert as MapAlert
  })
}

export const backendAlertsService = {
  // NUEVO: alertas con sus coordenadas geográficas.
  async map(): Promise<MapAlert[]> {
    const data = await apiFetch<unknown>('/alertas/mapa')

    return assertMapAlerts(data)
  },

  // Obtener todas las alertas.
  async list(): Promise<BackendAlert[]> {
    const data = await apiFetch<unknown>('/alertas')

    return assertAlertList(data)
  },

  // Obtener alertas de una institución.
  async byInstitution(
    institutionId: string
  ): Promise<BackendAlert[]> {
    const data = await apiFetch<unknown>(
      `/alertas?id_institucion=${encodeURIComponent(institutionId)}`
    )

    return assertAlertList(data)
  },

  // Obtener alertas activas.
  async active(): Promise<BackendAlert[]> {
    const data = await apiFetch<unknown>('/alertas/activas')

    return assertAlertList(data)
  },

  // Obtener el detalle de una alerta.
  async detail(id: string): Promise<BackendAlert> {
    const detail = await apiFetch<BackendAlert>(
      `/alertas/${encodeURIComponent(id)}`
    )

    if (!detail || detail.id_alerta == null) {
      throw new Error(
        'El backend devolvió un detalle de alerta inválido.'
      )
    }

    return detail
  },
}
