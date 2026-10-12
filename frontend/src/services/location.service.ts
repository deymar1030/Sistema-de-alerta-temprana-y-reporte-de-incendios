const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export interface GeographicZone {
  id_zona: string
  nombre: string
  departamento: string
  municipio: string
  descripcion: string
  estado: boolean
  densidad_poblacional: number
}

interface ApiGeographicZone {
  id_zona: string | number
  nombre: string
  departamento: string
  municipio: string
  descripcion: string
  estado: boolean
  densidad_poblacional: string | number
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
        'No fue posible obtener las zonas geográficas.',
    )
  }

  return result.data
}

const mapZone = (
  zone: ApiGeographicZone,
): GeographicZone => ({
  id_zona: String(zone.id_zona),

  nombre: zone.nombre,
  departamento: zone.departamento,
  municipio: zone.municipio,
  descripcion: zone.descripcion,

  estado: zone.estado,

  densidad_poblacional:
    Number(zone.densidad_poblacional) || 0,
})

export const locationService = {
  async getLocations(): Promise<
    GeographicZone[]
  > {
    const data =
      await request<ApiGeographicZone[]>(
        `${API_URL}/zonas-geograficas`,
      )

    return data.map(mapZone)
  },

  async getLocationById(
    id: string,
  ): Promise<GeographicZone> {
    const data =
      await request<ApiGeographicZone>(
        `${API_URL}/zonas-geograficas/${id}`,
      )

    return mapZone(data)
  },
}