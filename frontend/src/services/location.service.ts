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

export interface CreateGeographicZonePayload {
  nombre: string
  departamento: string
  municipio: string
  descripcion: string
  densidad_poblacional: number
}

export interface UpdateGeographicZonePayload {
  nombre?: string
  departamento?: string
  municipio?: string
  descripcion?: string
  densidad_poblacional?: number
  estado?: boolean
}

interface ApiGeographicZone {
  id_zona: string | number
  nombre: string
  departamento: string
  municipio: string
  descripcion: string | null
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
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  if (response.status === 401) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.',
    )
  }

  const text = await response.text()

  let result: ApiResponse<T>

  if (text) {
    result = JSON.parse(text) as ApiResponse<T>
  } else {
    result = {
      success: response.ok,
      data: undefined as T,
    }
  }

  if (!response.ok || !result.success) {
    throw new Error(
      result.error ??
        'No fue posible completar la operación con la zona geográfica.',
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
  descripcion: zone.descripcion ?? '',
  estado: Boolean(zone.estado),
  densidad_poblacional:
    Number(zone.densidad_poblacional) || 0,
})

export const locationService = {
  async getLocations(): Promise<GeographicZone[]> {
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

  async createLocation(
    payload: CreateGeographicZonePayload,
  ): Promise<GeographicZone> {
    const data =
      await request<ApiGeographicZone>(
        `${API_URL}/zonas-geograficas`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      )

    return mapZone(data)
  },

  async updateLocation(
    id: string,
    payload: UpdateGeographicZonePayload,
  ): Promise<GeographicZone> {
    const data =
      await request<ApiGeographicZone>(
        `${API_URL}/zonas-geograficas/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        },
      )

    return mapZone(data)
  },

  async deleteLocation(
    id: string,
  ): Promise<void> {
    await request<unknown>(
      `${API_URL}/zonas-geograficas/${id}`,
      {
        method: 'DELETE',
      },
    )
  },
}