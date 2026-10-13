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
  contrasena_mqtt?: string
  estado_electrico: number
  estado_gas: number
  fuentes_calor: number
  carga_combustible: number
  material_construccion: number
  ocupacion: number
  nivel_proteccion: number
}

export interface CreatePredioInput {
  id_zona: number | string
  id_motordet: number | string
  tipo_predio: string
  nombre: string
  direccion: string
  latitud: number | string
  longitud: number | string
  contrasena_mqtt?: string
  fecha_evaluacion?: string
  estado_electrico: number | string
  estado_gas: number | string
  fuentes_calor: number | string
  carga_combustible: number | string
  material_construccion: number | string
  ocupacion: number | string
  nivel_proteccion: number | string
}

interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: string
  code?: string
}

const parseData = <T>(payload: unknown): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

const request = async <T>(
  url: string,
  init: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (response.status === 401) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.',
    )
  }

  const payload = await response.json().catch(() => null)
  const result = payload as ApiResponse<T> | null

  if (!response.ok || (typeof result?.success === 'boolean' && !result.success)) {
    throw new Error(
      result?.error ??
        'No fue posible completar la operación con los predios.',
    )
  }

  return parseData<T>(payload)
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

  async createPredio(
    input: CreatePredioInput,
  ): Promise<PredioDetail> {
    return request<PredioDetail>(`${API_URL}/predios`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
  },

  async updatePredio(
    id: string,
    input: Partial<CreatePredioInput>,
  ): Promise<PredioDetail> {
    return request<PredioDetail>(`${API_URL}/predios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
  },

  async deletePredio(id: string): Promise<void> {
    await request<void>(`${API_URL}/predios/${id}`, {
      method: 'DELETE',
    })
  },
}