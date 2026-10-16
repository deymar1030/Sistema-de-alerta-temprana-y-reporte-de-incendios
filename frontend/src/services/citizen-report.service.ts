import type {
  CitizenReport,
  CitizenReportStatus,
} from '../types'

const API_URL =
  import.meta.env.VITE_API_URL ?? '/api'

interface ApiCitizenReport {
  id_reporte_u: string | number
  id_usuario: string | number

  descripcion: string
  tipo: string
  nivel_prioridad: string

  estado: string
  fecha_envio: string

  latitud: number
  longitud: number

  indicador: string | null
  foto_url: string | null

  alerta_vinculada?: {
    id_alerta: string | number
    estado: string
  } | null
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  code?: string
}

export interface CreateCitizenReportInput {
  id?: string
  citizenId?: string
  id_usuario?: string | number
  descripcion?: string
  description?: string
  address?: string
  ubicacion?: string
  latitude?: number
  latitud?: number
  longitude?: number
  longitud?: number
  reference?: string
  tipo?: string
  nivel_prioridad?: string
  nivelPrioridad?: string
  lat?: number
  lng?: number
  indicador?: string
  foto_url?: string
  photo?: string
  status?: CitizenReportStatus
  createdAt?: string
}

const mapStatus = (
  status: string,
): CitizenReportStatus => {
  switch (status) {
    case 'PENDIENTE_DE_VALIDACION':
      return 'PENDIENTE_DE_VALIDACION'
    case 'EN_REVISION':
      return 'EN_REVISION'
    case 'CONFIRMADO':
      return 'CONFIRMADO'
    case 'RECHAZADO':
      return 'RECHAZADO'
    case 'ATENDIENDO':
      return 'ATENDIENDO'
    case 'FINALIZADO':
      return 'FINALIZADO'
    case 'RECIBIDO':
      return 'PENDIENTE_DE_VALIDACION'
    case 'VALIDADO':
      return 'CONFIRMADO'
    case 'DESCARTADO':
      return 'RECHAZADO'
    case 'ATENDIDO':
      return 'ATENDIENDO'
    default:
      return 'PENDIENTE_DE_VALIDACION'
  }
}

const getFileName = (
  url: string | null,
): string | undefined => {
  if (!url) return undefined

  const parts = url.split('/')

  return parts[parts.length - 1] || undefined
}

const mapApiReport = (
  report: ApiCitizenReport,
): CitizenReport => {
  const factores =
    report.indicador
      ?.split(',')
      .map((item) => item.trim())
      .filter(Boolean) ?? []

  return {
    id: String(report.id_reporte_u),

    usuarioId: String(report.id_usuario),
    citizenId: String(report.id_usuario),
    description: report.descripcion,
    descripcion: report.descripcion,

    tipo: report.tipo,

    nivelPrioridad:
      report.nivel_prioridad,

    address:
      report.tipo
        ?.replaceAll('_', ' ') ??
      'Ubicación reportada',
    ubicacion:
      report.tipo
        ?.replaceAll('_', ' ') ??
      'Ubicación reportada',

    latitude: Number(report.latitud),
    latitud: Number(report.latitud),
    longitude: Number(report.longitud),
    longitud: Number(report.longitud),

    status: mapStatus(report.estado),

    createdAt:
      report.fecha_envio,

    photo: report.foto_url ?? undefined,
    fotoNombre:
      getFileName(report.foto_url),

    fotoUrl:
      report.foto_url ?? undefined,

    factores,

    alertId:
      report.alerta_vinculada
        ? String(
            report.alerta_vinculada.id_alerta,
          )
        : null,
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
        'No fue posible procesar el reporte.',
    )
  }

  return result.data
}

export const citizenReportService = {
  async getReports(): Promise<
    CitizenReport[]
  > {
    const data =
      await request<ApiCitizenReport[]>(
        `${API_URL}/reportes-usuario`,
      )

    return data.map(mapApiReport)
  },

  async getReportById(
    id: string,
  ): Promise<CitizenReport> {
    const data =
      await request<ApiCitizenReport>(
        `${API_URL}/reportes-usuario/${id}`,
      )

    return mapApiReport(data)
  },

  async createReport(
    input: CreateCitizenReportInput,
  ): Promise<CitizenReport> {
    const data =
      await request<ApiCitizenReport>(
        `${API_URL}/reportes-usuario`,
        {
          method: 'POST',

          body: JSON.stringify(input),
        },
      )

    return mapApiReport(data)
  },

  async updateStatus(
    id: string,
    status: CitizenReportStatus,
  ): Promise<void> {
    await request(
      `${API_URL}/reportes-usuario/${id}/estado`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          estado: status,
        }),
      },
    )
  },

  async linkAlert(
    id: string,
    alertId: string,
  ): Promise<void> {
    await request(
      `${API_URL}/reportes-usuario/${id}/vincular-alerta`,
      {
        method: 'PATCH',

        body: JSON.stringify({
          id_alerta: Number(alertId),
        }),
      },
    )
  },
}