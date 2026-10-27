
import { apiFetch } from './http'
import type { CitizenReport } from '../types'

function normalizeReport(payload: any): CitizenReport {
  const id =
    payload?.id_reporte_u ??
    payload?.id

  if (id == null || id === '') {
    throw new Error(
      'El servidor devolvió un reporte sin identificador.'
    )
  }

  const latitude = Number(
    payload?.latitud ??
    payload?.latitude ??
    payload?.location?.coordinates?.latitude
  )

  const longitude = Number(
    payload?.longitud ??
    payload?.longitude ??
    payload?.location?.coordinates?.longitude
  )

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    throw new Error(
      `El reporte ${id} no tiene coordenadas válidas.`
    )
  }

  return {
    id: String(id),

    citizenId:
      payload?.id_usuario == null
        ? undefined
        : String(payload.id_usuario),

    description:
      payload?.descripcion ??
      payload?.description ??
      '',

    incidentType:
      payload?.tipo ??
      payload?.tipo_incidente ??
      payload?.incidentType ??
      'INCENDIO',

    location: {
      city:
        payload?.ciudad ??
        payload?.location?.city ??
        'No especificada',

      coordinates: {
        latitude,
        longitude,
      },
    },

    photo:
      payload?.foto_url ??
      payload?.photo ??
      undefined,

    photoUrl:
      payload?.foto_url ??
      payload?.photoUrl ??
      undefined,

    smokeVisible: Boolean(
      payload?.humo_visible ??
      payload?.smokeVisible ??
      false
    ),

    flamesVisible: Boolean(
      payload?.llamas_visible ??
      payload?.flamesVisible ??
      false
    ),

    peopleAtRisk: Boolean(
      payload?.personas_en_riesgo ??
      payload?.peopleAtRisk ??
      false
    ),

    explosions: Boolean(
      payload?.explosiones ??
      false
    ),

    status: (
      payload?.estado ??
      payload?.status ??
      'PENDIENTE_DE_VALIDACION'
    ) as CitizenReport['status'],

    createdAt:
      payload?.fecha_envio ??
      payload?.createdAt ??
      '',
  }
}

export const citizenReportService = {
  async createReport(
    payload: Partial<CitizenReport> & {
      latitude?: number
      longitude?: number
      id_institucion?: string
      descripcion?: string
      foto_url?: string
    }
  ): Promise<CitizenReport> {
    const latitude =
      payload.latitude ??
      payload.location?.coordinates?.latitude

    const longitude =
      payload.longitude ??
      payload.location?.coordinates?.longitude

    if (
      latitude == null ||
      longitude == null ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude)) ||
      Math.abs(Number(latitude)) > 90 ||
      Math.abs(Number(longitude)) > 180
    ) {
      throw new Error(
        'Selecciona una ubicación válida antes de enviar el reporte.'
      )
    }

    const body = {
      descripcion:
        payload.description ??
        payload.descripcion,

      tipo: payload.incidentType,

      latitud: Number(latitude),
      longitud: Number(longitude),

      indicador: [
        payload.smokeVisible ? 'HUMO' : null,
        payload.flamesVisible ? 'LLAMAS' : null,
        payload.peopleAtRisk
          ? 'PERSONAS_EN_RIESGO'
          : null,
        payload.explosions ? 'EXPLOSIONES' : null,
      ]
        .filter(Boolean)
        .join(','),

      foto_url:
        payload.photoUrl ??
        payload.foto_url ??
        payload.photo,
    }

    const result = await apiFetch<unknown>(
      '/reportes-usuario',
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    )

    // Solo confirmar éxito si el servidor devuelve
    // un identificador real del reporte.
    return normalizeReport(result)
  },

  async getReports(): Promise<CitizenReport[]> {
    const data = await apiFetch<unknown>(
      '/reportes-usuario'
    )

    if (!Array.isArray(data)) {
      throw new Error(
        'El servidor devolvió un listado de reportes inválido.'
      )
    }

    return data.map(normalizeReport)
  },

  async getReportById(
    id: string
  ): Promise<CitizenReport> {
    const data = await apiFetch<unknown>(
      `/reportes-usuario/${encodeURIComponent(id)}`
    )

    return normalizeReport(data)
  },
}
