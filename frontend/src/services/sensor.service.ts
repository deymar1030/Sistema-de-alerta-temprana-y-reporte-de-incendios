import type { Sensor, SensorState } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

interface ApiSensor {
  id_sensor: string
  id_predio: string
  nombre: string
  tipo_sensor: string
  unidad_medida: string
  modelo: string
  fabricante: string
  fecha_instalacion: string
  estado: string
  rango_min: number
  rango_max: number
  ultima_lectura?: {
    valor: number
    fecha_hora: string
  } | null
  predio?: {
    id_predio: string
    nombre: string
    latitud: number
    longitud: number
  } | null
}

export interface CreateSensorInput {
  id_predio: number | string
  nombre: string
  tipo_sensor: string
  estado: string
  modelo: string
  fabricante: string
  unidad_medida: string
  fecha_instalacion: string
  rango_min: number | string
  rango_max: number | string
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
        'No fue posible completar la operación con los sensores.',
    )
  }

  return parseData<T>(payload)
}

const mapSensorState = (estado: string): SensorState => {
  switch (estado) {
    case 'ACTIVO':
      return 'Activo'
    case 'INACTIVO':
      return 'Inactivo'
    case 'MANTENIMIENTO':
      return 'Mantenimiento'
    case 'ERROR':
      return 'Error'
    default:
      return 'Inactivo'
  }
}

const mapSensorType = (
  tipo: string,
): Sensor['tipo_sensor'] => {
  switch (tipo) {
    case 'TEMPERATURA':
      return 'Temperatura'
    case 'HUMO':
      return 'Humo'
    case 'CO':
      return 'CO'
    case 'HUMEDAD':
      return 'Humedad'
    default:
      return 'Temperatura'
  }
}

const mapApiSensor = (sensor: ApiSensor): Sensor => {
  return {
    id_sensor: sensor.id_sensor,
    id_predio: sensor.id_predio,
    nombre: sensor.nombre,
    tipo_sensor: mapSensorType(sensor.tipo_sensor),
    variable: sensor.tipo_sensor,
    unidad_medida: sensor.unidad_medida,
    modelo: sensor.modelo,
    fabricante: sensor.fabricante,
    fecha_instalacion: sensor.fecha_instalacion,
    estado: mapSensorState(sensor.estado),
    ubicacion: sensor.predio?.nombre ?? 'Ubicación no disponible',
    lat: sensor.predio?.latitud ?? 0,
    lng: sensor.predio?.longitud ?? 0,
    ultima_lectura: sensor.ultima_lectura?.valor ?? null,
    rango_min: sensor.rango_min,
    rango_max: sensor.rango_max,
    riesgo: 'normal',
    descripcion: '',
  }
}

const getSensorDetail = async (
  id: string,
): Promise<Sensor | undefined> => {
  const response = await fetch(
    `${API_URL}/sensores/${id}`,
    {
      method: 'GET',
      credentials: 'include',
    },
  )

  if (response.status === 401) {
    throw new Error(
      'La sesión ha expirado. Inicia sesión nuevamente.',
    )
  }

  if (response.status === 404) {
    return undefined
  }

  const payload = await response.json().catch(() => null)
  const result = payload as ApiResponse<ApiSensor> | null

  if (!response.ok || (typeof result?.success === 'boolean' && !result.success)) {
    throw new Error(
      result?.error ?? 'No se pudo obtener el sensor.',
    )
  }

  return mapApiSensor(parseData<ApiSensor>(payload))
}

export const sensorService = {
  async getSensors(): Promise<Sensor[]> {
    const response = await fetch(
      `${API_URL}/sensores`,
      {
        method: 'GET',
        credentials: 'include',
      },
    )

    if (response.status === 401) {
      throw new Error(
        'La sesión ha expirado. Inicia sesión nuevamente.',
      )
    }

    const payload = await response.json().catch(() => null)
    const result = payload as ApiResponse<ApiSensor[]> | null

    if (!response.ok || (typeof result?.success === 'boolean' && !result.success)) {
      throw new Error(
        result?.error ??
          'No se pudieron obtener los sensores.',
      )
    }

    const sensors = parseData<ApiSensor[]>(payload)

    return await Promise.all(
      sensors.map(async (sensor) => {
        try {
          const detail =
            await getSensorDetail(sensor.id_sensor)
          return detail ?? mapApiSensor(sensor)
        } catch {
          return mapApiSensor(sensor)
        }
      }),
    )
  },

  async getSensorById(
    id: string,
  ): Promise<Sensor | undefined> {
    return getSensorDetail(id)
  },

  async createSensor(
    input: CreateSensorInput,
  ): Promise<Sensor> {
    const sensor = await request<ApiSensor>(`${API_URL}/sensores`, {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return mapApiSensor(sensor)
  },

  async updateSensor(
    id: string,
    input: Partial<CreateSensorInput>,
  ): Promise<Sensor> {
    const sensor = await request<ApiSensor>(`${API_URL}/sensores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    })
    return mapApiSensor(sensor)
  },

  async deleteSensor(id: string): Promise<void> {
    await request<void>(`${API_URL}/sensores/${id}`, {
      method: 'DELETE',
    })
  },
}