import type { AttentionReport, ReportStatus } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

interface ApiAttentionReport {
  id_informe_atencion: string
  id_alerta: string
  id_institucion: string
  id_usuario: string
  estado: string
  fecha_incidente: string
  hora_recepcion: string
  hora_salida: string | null
  hora_llegada: string | null
  hora_control: string | null
  hora_finalizacion: string | null
  personal: number
  vehiculos: number
  personas_afectadas: number
  personas_evacuadas: number
  heridos: number
  fallecidos: number
  danos_materiales: string | null
  causa: string | null
  acciones: string | null
  observaciones: string | null
  recomendaciones: string | null
  fecha_envio: string | null
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  code?: string
}

export interface CreateAttentionReportInput {
  id_alerta: string
  id_institucion: string
  id_usuario: string
  estado: ReportStatus
  fecha_incidente: string
  hora_recepcion: string
  hora_salida?: string
  hora_llegada?: string
  hora_control?: string
  hora_finalizacion?: string
  personal: number
  vehiculos: number
  personas_afectadas: number
  personas_evacuadas: number
  heridos: number
  fallecidos: number
  danos_materiales: string
  causa: string
  acciones: string
  observaciones: string
  recomendaciones: string
}

export interface UpdateAttentionReportInput {
  estado?: ReportStatus
  fecha_incidente?: string
  hora_recepcion?: string
  hora_salida?: string
  hora_llegada?: string
  hora_control?: string
  hora_finalizacion?: string
  personal?: number
  vehiculos?: number
  personas_afectadas?: number
  personas_evacuadas?: number
  heridos?: number
  fallecidos?: number
  danos_materiales?: string
  causa?: string
  acciones?: string
  observaciones?: string
  recomendaciones?: string
}

const mapStatus = (status: string): ReportStatus => {
  switch (status) {
    case 'BORRADOR':
      return 'BORRADOR'
    case 'COMPLETADO':
      return 'COMPLETADO'
    case 'REVISADO':
      return 'REVISADO'
    case 'PENDIENTE':
      return 'PENDIENTE'
    default:
      return 'BORRADOR'
  }
}

const mapApiReport = (
  report: ApiAttentionReport,
): AttentionReport => {
  return {
    id: report.id_informe_atencion,
    incidentId: report.id_alerta,
    institutionId: report.id_institucion,
    status: mapStatus(report.estado),

    fechaIncidente: report.fecha_incidente,
    horaRecepcion: report.hora_recepcion,
    horaSalida: report.hora_salida ?? '',
    horaLlegada: report.hora_llegada ?? '',
    horaControl: report.hora_control ?? '',
    horaFinalizacion: report.hora_finalizacion ?? '',

    personal: report.personal,
    vehiculos: report.vehiculos,
    personasAfectadas: report.personas_afectadas,
    personasEvacuadas: report.personas_evacuadas,
    heridos: report.heridos,
    fallecidos: report.fallecidos,

    danosMateriales: report.danos_materiales ?? '',
    causa: report.causa ?? '',
    acciones: report.acciones ?? '',
    observaciones: report.observaciones ?? '',
    recomendaciones: report.recomendaciones ?? '',

    // El backend no devuelve adjuntos dentro del informe.
    attachments: [],
  }
}

const request = async <T>(
  url: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
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
        'No fue posible procesar el informe de atención.',
    )
  }

  return result.data
}

export const reportService = {
  async getReports(): Promise<AttentionReport[]> {
    const data =
      await request<ApiAttentionReport[]>(
        `${API_URL}/informes-atencion`,
      )

    return data.map(mapApiReport)
  },

  async getReportById(
    id: string,
  ): Promise<AttentionReport> {
    const data =
      await request<ApiAttentionReport>(
        `${API_URL}/informes-atencion/${id}`,
      )

    return mapApiReport(data)
  },

  async createReport(
    input: CreateAttentionReportInput,
  ): Promise<AttentionReport> {
    const data =
      await request<ApiAttentionReport>(
        `${API_URL}/informes-atencion`,
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      )

    return mapApiReport(data)
  },

  async updateReport(
    id: string,
    input: UpdateAttentionReportInput,
  ): Promise<AttentionReport> {
    const data =
      await request<ApiAttentionReport>(
        `${API_URL}/informes-atencion/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
      )

    return mapApiReport(data)
  },
}