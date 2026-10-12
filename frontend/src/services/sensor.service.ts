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

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  code?: string
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

    ubicacion:
      sensor.predio?.nombre ?? 'Ubicación no disponible',

    lat:
      sensor.predio?.latitud ?? 0,

    lng:
      sensor.predio?.longitud ?? 0,

    ultima_lectura:
      sensor.ultima_lectura?.valor ?? null,

    rango_min: sensor.rango_min,

    rango_max: sensor.rango_max,

    // El nivel de riesgo será definido por el motor de detección.
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

  const result: ApiResponse<ApiSensor> =
    await response.json()

  if (!response.ok || !result.success) {
    throw new Error(
      result.error ?? 'No se pudo obtener el sensor.',
    )
  }

  return mapApiSensor(result.data)
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

    const result: ApiResponse<ApiSensor[]> =
      await response.json()

    if (!response.ok || !result.success) {
      throw new Error(
        result.error ??
          'No se pudieron obtener los sensores.',
      )
    }

    /*
     * El listado básico no incluye predio ni última lectura.
     * Consultamos temporalmente cada detalle para completar
     * la información utilizada por la interfaz.
     */
    const sensors = await Promise.all(
      result.data.map(async (sensor) => {
        try {
          const detail =
            await getSensorDetail(sensor.id_sensor)

          return detail ?? mapApiSensor(sensor)
        } catch {
          return mapApiSensor(sensor)
        }
      }),
    )

    return sensors
  },

  async getSensorById(
    id: string,
  ): Promise<Sensor | undefined> {
    return getSensorDetail(id)
  },
}