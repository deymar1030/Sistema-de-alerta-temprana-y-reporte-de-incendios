import type {
  CitizenReport,
  Incident,
  IncidentStatus,
  RiskLevel,
} from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

interface ApiAlertListItem {
  id_alerta: string
  fecha: string
  hora: string
  estado: string
  puntaje: number
  clasificacion: string | null
  fecha_confirmacion: string | null
  fecha_cierre: string | null
}

interface ApiAlertDetail extends ApiAlertListItem {
  predio?: {
    id_predio: string
    nombre: string
    tipo_predio: string
    latitud: number
    longitud: number
    irp: number
  } | null

  lecturas?: Array<{
    id_lectura: string
    id_sensor: string
    id_alerta: string | null
    valor: number
    fecha_hora: string
    estado_lectura: string
    tipo_variable: string
  }>

  instituciones_notificadas?: unknown[]
  reporte_origen?: {
    id_reporte?: string
  } | null
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  code?: string
}

const request = async <T>(
  url: string,
): Promise<T> => {
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  if (response.status === 401) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.',
    )
  }

  const result: ApiResponse<T> =
    await response.json()

  if (!response.ok || !result.success) {
    throw new Error(
      result.error ??
        'No fue posible obtener las alertas.',
    )
  }

  return result.data
}

const mapRisk = (puntaje: number): RiskLevel => {
  if (puntaje >= 0.9) return 'critical'
  if (puntaje >= 0.75) return 'high'
  if (puntaje >= 0.5) return 'warning'
  return 'normal'
}

const mapStatus = (
  estado: string,
): IncidentStatus => {
  switch (estado) {
    case 'EN_EVALUACION':
      return 'EN_VALIDACION'

    case 'CONFIRMADA':
      return 'VALIDADA'

    case 'ATENDIDA':
      return 'CONTROLADA'

    case 'CERRADA':
      return 'CERRADA'

    default:
      return 'NUEVA'
  }
}

const buildCreatedAt = (
  fecha: string,
  hora: string,
): string => {
  return `${fecha}T${hora}`
}

const mapAlertToIncident = (
  alert: ApiAlertDetail,
): Incident => {
  const firstReading =
    alert.lecturas?.[0]

  const description =
    alert.clasificacion
      ? `Alerta clasificada como ${alert.clasificacion}.`
      : firstReading
        ? `Lectura anómala de ${firstReading.tipo_variable}: ${firstReading.valor}.`
        : 'Alerta generada por el sistema de detección.'

  return {
    id: alert.id_alerta,
    alertId: alert.id_alerta,

    origen:
      alert.reporte_origen
        ? 'CIUDADANO'
        : 'SENSOR',

    status: mapStatus(alert.estado),

    riesgo: mapRisk(alert.puntaje),

    ubicacion:
      alert.predio?.nombre ??
      'Ubicación no disponible',

    latitud:
      alert.predio?.latitud ?? 0,

    longitud:
      alert.predio?.longitud ?? 0,

    descripcion: description,

    createdAt: buildCreatedAt(
      alert.fecha,
      alert.hora,
    ),

    updatedAt:
      alert.fecha_confirmacion ??
      alert.fecha_cierre ??
      buildCreatedAt(
        alert.fecha,
        alert.hora,
      ),

    citizenReportId:
      alert.reporte_origen?.id_reporte,

    institucionesNotificadas:
    alert.instituciones_notificadas?.length ?? 0,
  }
}

const getAlertDetail = async (
  id: string,
): Promise<Incident> => {
  const data =
    await request<ApiAlertDetail>(
      `${API_URL}/alertas/${id}`,
    )

  return mapAlertToIncident(data)
}

export const incidentService = {
  async getIncidents(): Promise<Incident[]> {
    const alerts =
      await request<ApiAlertListItem[]>(
        `${API_URL}/alertas`,
      )

    const incidents =
      await Promise.all(
        alerts.map(async (alert) => {
          try {
            return await getAlertDetail(
              alert.id_alerta,
            )
          } catch {
            return mapAlertToIncident(alert)
          }
        }),
      )

    return incidents
  },

  async updateStatus(
    id: string,
    status: IncidentStatus,
  ): Promise<Incident | undefined> {
    /*
     * Temporalmente no modificamos el backend aquí.
     * Los cambios reales de estado deben mapearse
     * a los endpoints específicos de alertas/instituciones.
     */
    const incidents =
      await this.getIncidents()

    const incident =
      incidents.find(
        (item) => item.id === id,
      )

    if (!incident) {
      return undefined
    }

    return {
      ...incident,
      status,
      updatedAt:
        new Date().toISOString(),
    }
  },

  async createFromCitizenReport(
    report: CitizenReport,
  ): Promise<Incident> {
    /*
     * Temporalmente se conserva esta transformación.
     * Luego se conectará con /api/reportes-usuario.
     */
    return {
      id: report.id,

      alertId: null,

      origen: 'CIUDADANO',

      status: 'EN_VALIDACION',

      riesgo: 'warning',

      ubicacion:
        report.ubicacion ?? report.address ?? 'Ubicación reportada',

      latitud:
        report.latitud ?? report.latitude ?? 0,

      longitud:
        report.longitud ?? report.longitude ?? 0,

      descripcion:
        report.descripcion ?? report.description ?? 'Reporte ciudadano',

      createdAt:
        report.createdAt,

      updatedAt:
        report.createdAt,

      citizenReportId:
        report.id,
    }
  },
}