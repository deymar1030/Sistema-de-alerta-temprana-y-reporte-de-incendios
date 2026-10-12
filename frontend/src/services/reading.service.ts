import type { Reading, RiskLevel } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

interface ApiReading {
  id_lectura: string
  id_sensor: string
  id_alerta: string | null
  valor: number
  fecha_hora: string
  estado_lectura: string
  tipo_variable: string
}

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  code?: string
}

const mapVariable = (value: string): string => {
  switch (value) {
    case 'TEMPERATURA':
      return 'Temperatura'

    case 'HUMO':
      return 'Humo'

    case 'CO':
      return 'CO'

    case 'HUMEDAD':
      return 'Humedad'

    default:
      return value
  }
}

const mapUnit = (variable: string): string => {
  switch (variable) {
    case 'TEMPERATURA':
      return 'C'

    case 'HUMO':
      return 'ppm'

    case 'CO':
      return 'ppm'

    case 'HUMEDAD':
      return '%'

    default:
      return ''
  }
}

const mapRisk = (estadoLectura: string): RiskLevel => {
  switch (estadoLectura) {
    case 'ANOMALA':
      return 'high'

    case 'VALIDA':
      return 'normal'

    default:
      return 'normal'
  }
}

const mapState = (
  estadoLectura: string,
): Reading['estado'] => {
  switch (estadoLectura) {
    case 'ANOMALA':
      return 'Alerta'

    case 'VALIDA':
      return 'Normal'

    default:
      return 'Normal'
  }
}

const mapApiReading = (
  reading: ApiReading,
): Reading => {
  return {
    id_lectura: reading.id_lectura,
    id_sensor: reading.id_sensor,

    // El endpoint de lecturas no devuelve el nombre del sensor.
    sensor: `Sensor ${reading.id_sensor}`,

    variable: mapVariable(
      reading.tipo_variable,
    ),

    valor: Number(reading.valor),

    unidad: mapUnit(
      reading.tipo_variable,
    ),

    fecha_hora: reading.fecha_hora,

    estado: mapState(
      reading.estado_lectura,
    ),

    riesgo: mapRisk(
      reading.estado_lectura,
    ),
  }
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
        'No fue posible obtener las lecturas.',
    )
  }

  return result.data
}

export const readingService = {
  async getReadings(): Promise<Reading[]> {
    const data = await request<ApiReading[]>(
      `${API_URL}/lecturas`,
    )

    return data.map(mapApiReading)
  },

  async getReadingsBySensor(
    sensorId: string,
  ): Promise<Reading[]> {
    const data = await request<ApiReading[]>(
      `${API_URL}/sensores/${sensorId}/lecturas`,
    )

    return data.map(mapApiReading)
  },
}