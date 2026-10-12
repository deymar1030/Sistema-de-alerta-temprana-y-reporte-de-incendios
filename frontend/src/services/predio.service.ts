const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export interface PredioMapEntry {
  id_predio: string
  nombre: string
  tipo_predio: string
  latitud: number
  longitud: number
  irp: number
}

export interface PredioDetail extends PredioMapEntry {
  id_zona: string
  id_motordet: string
  direccion: string
  fecha_evaluacion: string

  estado_electrico: number
  estado_gas: number
  fuentes_calor: number
  carga_combustible: number
  material_construccion: number
  ocupacion: number
  nivel_proteccion: number
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
        'No fue posible obtener los predios.',
    )
  }

  return result.data
}

export const predioService = {
  async getMapPredios(): Promise<PredioMapEntry[]> {
    return request<PredioMapEntry[]>(
      `${API_URL}/predios/mapa`,
    )
  },

  async getPredios(): Promise<PredioDetail[]> {
    return request<PredioDetail[]>(
      `${API_URL}/predios`,
    )
  },

  async getPredioById(
    id: string,
  ): Promise<PredioDetail> {
    return request<PredioDetail>(
      `${API_URL}/predios/${id}`,
    )
  },
}