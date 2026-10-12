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

  classification?: string | null
  score?: number

  propertyName?: string
  propertyType?: string
}

function riskFromScore(
  score: number,
): Alert['riskLevel'] {
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
    return new Date().toISOString()
  }

  /*
   * El backend devuelve, por ejemplo:
   * fecha = 2026-10-07
   * hora  = 12:13:20
   */
  const value = hora
    ? `${fecha}T${hora}`
    : fecha

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString()
  }

  return date.toISOString()
}

function normalizeAlert(
  payload: BackendAlert,
): MobileAlert {
  const score = Number(
    payload.puntaje ?? 0,
  )

  const notifications =
    Array.isArray(
      payload.instituciones_notificadas,
    )
      ? payload.instituciones_notificadas
      : []

  const institutionIds =
    notifications.map((item) =>
      String(item.id_institucion),
    )

  return {
    id: String(payload.id_alerta),

    source:
      (payload.origen ??
        'SENSOR') as Alert['source'],

    status:
      (payload.estado ??
        'EN_EVALUACION') as Alert['status'],

    riskLevel: riskFromScore(score),

    location: {
      city:
        payload.predio?.nombre ??
        'Ubicación no disponible',

      coordinates: {
        latitude: Number(
          payload.predio?.latitud ?? 0,
        ),

        longitude: Number(
          payload.predio?.longitud ?? 0,
        ),
      },
    },

    createdAt: buildDateTime(
      payload.fecha,
      payload.hora,
    ),

    description:
      payload.descripcion ??
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

    institutionStatus: null,
  } as MobileAlert
}

async function getAlertDetail(
  id: string,
): Promise<MobileAlert> {
  const response =
    await apiFetch<any>(
      `/alertas/${id}`,
    )

  const data =
    response?.data ??
    response

  return normalizeAlert(data)
}

export const alertService = {
  async getAlerts(): Promise<
    MobileAlert[]
  > {
    const response =
      await apiFetch<any>(
        '/alertas',
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
              )
            } catch {
              return normalizeAlert(
                item,
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
  ): Promise<MobileAlert | null> {
    try {
      return await getAlertDetail(
        id,
      )
    } catch {
      return null
    }
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