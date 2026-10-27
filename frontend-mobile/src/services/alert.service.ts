import { apiFetch } from './http'
import type { Alert } from '../types'

interface BackendInstitutionNotification {
  id_institucion: string | number
  nombre?: string
  estado?: string
  fecha_envio?: string
  fecha_actualizacion?: string | null
}

interface BackendPredio {
  id_predio?: string | number
  nombre?: string
  tipo_predio?: string
  latitud?: number
  longitud?: number
  irp?: number
}

interface BackendAlert {
  reporte_origen?: {
    latitud?: number | null
    longitud?: number | null
    ubicacion_tipo?: string | null
    descripcion?: string | null
  } | null
  id_alerta: string | number

  fecha?: string
  hora?: string

  estado?: string

  puntaje?: number
  clasificacion?: string | null

  descripcion?: string | null
  origen?: string

  predio?: BackendPredio | null

  instituciones_notificadas?: BackendInstitutionNotification[]

  [key: string]: unknown
}

export type MobileAlert = Alert & {
  institutionIds?: string[]
  institutionStatus?: string | null
  institutionStatuses?: Record<string, string>
  hasCoordinates?: boolean

  classification?: string | null
  score?: number | null

  propertyName?: string
  propertyType?: string
}

function riskFromScore(
  score: number | null,
): Alert['riskLevel'] {
  if (score == null || !Number.isFinite(score)) return 'unknown'
  if (score >= 0.9) {
    return 'critical'
  }

  if (score >= 0.75) {
    return 'high'
  }

  if (score >= 0.5) {
    return 'warning'
  }

  return 'normal'
}

function buildDateTime(
  fecha?: string,
  hora?: string,
): string {
  if (!fecha) {
    return ''
  }

  /*
   * El backend devuelve, por ejemplo:
   * fecha = 2026-10-07
   * hora  = 12:13:20
   */
  const base = hora ? `${fecha}T${hora}` : `${fecha}T00:00:00`
  const value = /(?:Z|[+-]\d{2}:\d{2})$/i.test(base) ? base : `${base}Z`

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toISOString()
}

function normalizeAlert(
  payload: BackendAlert,
  currentInstitutionId?: string,
  isFilteredList = false,
): MobileAlert {
  const score = payload.puntaje == null ? null : Number(payload.puntaje)

  const notifications =
    Array.isArray(
      payload.instituciones_notificadas,
    )
      ? payload.instituciones_notificadas
      : []

  const institutionIds = notifications.map((item) => String(item.id_institucion))
  // En el listado filtrado, el backend ya delimita la institución.
  if (isFilteredList && currentInstitutionId && !institutionIds.length) institutionIds.push(currentInstitutionId)
  const institutionStatuses = Object.fromEntries(notifications.map(
    (item) => [String(item.id_institucion), item.estado ?? 'DESCONOCIDO'],
  ))
  const latitude = payload.predio?.latitud ?? payload.reporte_origen?.latitud
  const longitude = payload.predio?.longitud ?? payload.reporte_origen?.longitud
  const hasCoordinates = typeof latitude === 'number' && Number.isFinite(latitude)
    && typeof longitude === 'number' && Number.isFinite(longitude)

  return {
    id: String(payload.id_alerta),

    source:
      (payload.reporte_origen ? 'CITIZEN_REPORT' : payload.origen ?? 'SENSOR') as Alert['source'],

    status:
      (payload.estado ??
        'EN_EVALUACION') as Alert['status'],

    riskLevel: riskFromScore(score),

    location: {
      city:
        payload.predio?.nombre ?? payload.reporte_origen?.ubicacion_tipo ??
        'Ubicación no disponible',

      coordinates: {
        latitude: hasCoordinates ? Number(latitude) : 0,

        longitude: hasCoordinates ? Number(longitude) : 0,
      },
    },

    createdAt: buildDateTime(
      payload.fecha,
      payload.hora,
    ),

    description:
      payload.descripcion ?? payload.reporte_origen?.descripcion ??
      (payload.clasificacion
        ? `Alerta clasificada como ${payload.clasificacion}.`
        : 'Alerta registrada por el sistema.'),

    /*
     * Se mantiene por compatibilidad
     * con el contrato existente.
     */
    institutionId:
      institutionIds[0] ??
      undefined,

    /*
     * Datos adicionales útiles
     * para la aplicación móvil.
     */
    institutionIds,

    classification:
      payload.clasificacion ?? null,

    score,

    propertyName:
      payload.predio?.nombre ??
      'Ubicación no disponible',

    propertyType:
      payload.predio?.tipo_predio ??
      'No especificado',

    institutionStatuses,
    institutionStatus: currentInstitutionId ? institutionStatuses[currentInstitutionId] ?? null : null,
    hasCoordinates,
  } as MobileAlert
}

async function getAlertDetail(
  id: string,
  institutionId?: string,
): Promise<MobileAlert> {
  const response =
    await apiFetch<any>(
      `/alertas/${id}`,
    )

  const data =
    response?.data ??
    response

  return normalizeAlert(data, institutionId)
}

export const alertService = {
  async getAlerts(institutionId?: string): Promise<
    MobileAlert[]
  > {
    const response =
      await apiFetch<any>(
        institutionId ? `/alertas?id_institucion=${encodeURIComponent(institutionId)}` : '/alertas',
      )

    const items =
      Array.isArray(response)
        ? response
        : response?.data ??
          response?.alertas ??
          []

    /*
     * Pedimos el detalle porque ahí
     * el backend devuelve
     * instituciones_notificadas.
     *
     * Para el prototipo actual esto
     * permite filtrar correctamente
     * las alertas por institución.
     */
    const detailed =
      await Promise.all(
        items.map(
          async (
            item: BackendAlert,
          ) => {
            try {
              return await getAlertDetail(
                String(
                  item.id_alerta,
                ),
                institutionId,
              )
            } catch {
              return normalizeAlert(
                item,
                institutionId,
                Boolean(institutionId),
              )
            }
          },
        ),
      )

    return detailed
  },

  async getActiveAlerts(): Promise<
    MobileAlert[]
  > {
    const response =
      await apiFetch<any>(
        '/alertas/activas',
      )

    const items =
      Array.isArray(response)
        ? response
        : response?.data ??
          response?.alertas ??
          []

    return Promise.all(
      items.map(
        async (
          item: BackendAlert,
        ) => {
          try {
            return await getAlertDetail(
              String(
                item.id_alerta,
              ),
            )
          } catch {
            return normalizeAlert(
              item,
            )
          }
        },
      ),
    )
  },

  async getAlertById(
    id: string,
    institutionId?: string,
  ): Promise<MobileAlert> {
    // No confundir un error 401/500 con 'no existe'. La vista mostrará el error.
    return getAlertDetail(id, institutionId)
  },

  async receiveAlert(
    alertId: string,
    institutionId: string,
  ): Promise<void> {
    await apiFetch(
      `/alertas/${alertId}/instituciones/${institutionId}/recibir`,
      {
        method: 'PATCH',
      },
    )
  },

  async attendAlert(
    alertId: string,
    institutionId: string,
  ): Promise<void> {
    await apiFetch(
      `/alertas/${alertId}/instituciones/${institutionId}/atender`,
      {
        method: 'PATCH',
      },
    )
  },

  async closeAlert(
    alertId: string,
    institutionId: string,
  ): Promise<void> {
    await apiFetch(
      `/alertas/${alertId}/instituciones/${institutionId}/cerrar`,
      {
        method: 'PATCH',
      },
    )
  },
}