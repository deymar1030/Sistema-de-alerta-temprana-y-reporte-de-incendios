
import type { Sensor, SensorState } from '../types'
import { apiFetch } from './http'

const TYPE_LABELS: Record<string, string> = {
  TEMPERATURA: 'Temperatura',
  HUMEDAD: 'Humedad',
  HUMO: 'Humo',
  CO: 'CO',
  CO2: 'CO2',
  GAS_LEL: 'Gas LEL',
}

export const SENSOR_TYPES = [
  { value: 'TEMPERATURA', label: 'Temperatura', unit: '°C' },
  { value: 'HUMEDAD', label: 'Humedad', unit: '%' },
  { value: 'HUMO', label: 'Humo', unit: 'µg/m³' },
  { value: 'CO', label: 'Monóxido de carbono (CO)', unit: 'ppm' },
  { value: 'CO2', label: 'Dióxido de carbono (CO2)', unit: 'ppm' },
  { value: 'GAS_LEL', label: 'Gas combustible (LEL)', unit: '%LEL' },
] as const

export const SENSOR_STATES = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'MANTENIMIENTO', label: 'Mantenimiento' },
  { value: 'ERROR', label: 'Error' },
] as const

export interface CreateSensorInput {
  id_predio: number
  nombre: string
  tipo_sensor: string
  unidad_medida?: string
  modelo?: string
  fabricante?: string
  fecha_instalacion?: string
  estado?: string
  rango_min?: number
  rango_max?: number
}

export type UpdateSensorInput = Partial<CreateSensorInput>

type DataRecord = Record<string, unknown>

function isRecord(value: unknown): value is DataRecord {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

function stringOrEmpty(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : ''
}

function numericOrNull(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function statusLabel(raw: unknown): SensorState {
  switch (stringOrEmpty(raw).trim().toUpperCase()) {
    case 'ACTIVO':
      return 'Activo'
    case 'INACTIVO':
      return 'Inactivo'
    case 'MANTENIMIENTO':
      return 'Mantenimiento'
    case 'ERROR':
      return 'Error'
    default:
      return 'Desconocido'
  }
}

function mapSensor(raw: unknown): Sensor {
  if (!isRecord(raw)) {
    throw new Error(
      'La API devolvió un sensor con formato inválido.'
    )
  }

  const id = stringOrEmpty(raw.id_sensor).trim()

  if (!id) {
    throw new Error(
      'La API devolvió un sensor sin id_sensor.'
    )
  }

  const predio = isRecord(raw.predio) ? raw.predio : null
  const idPredio = stringOrEmpty(raw.id_predio).trim()
  const rawType = stringOrEmpty(raw.tipo_sensor)
    .trim()
    .toUpperCase()

  const lectura = isRecord(raw.ultima_lectura)
    ? raw.ultima_lectura
    : null

  // NaN evita inventar una coordenada 0,0.
  // MonitoringMap descarta coordenadas no finitas.
  const lat =
    numericOrNull(predio?.latitud) ?? Number.NaN

  const lng =
    numericOrNull(predio?.longitud) ?? Number.NaN

  return {
    id_sensor: id,
    id_predio: idPredio || undefined,
    nombre: stringOrEmpty(raw.nombre) || `Sensor #${id}`,

    tipo_sensor:
      TYPE_LABELS[rawType] ??
      (rawType || 'No especificado'),

    variable: rawType || 'DESCONOCIDO',
    unidad_medida: stringOrEmpty(raw.unidad_medida),
    modelo: stringOrEmpty(raw.modelo),
    fabricante: stringOrEmpty(raw.fabricante),
    fecha_instalacion: stringOrEmpty(
      raw.fecha_instalacion
    ),

    estado: statusLabel(raw.estado),

    ubicacion:
      stringOrEmpty(predio?.nombre) ||
      (idPredio ? `Predio #${idPredio}` : 'Sin predio'),

    lat,
    lng,

    ultima_lectura: numericOrNull(lectura?.valor),

    rango_min:
      numericOrNull(raw.rango_min) ?? undefined,

    rango_max:
      numericOrNull(raw.rango_max) ?? undefined,

    // Compatibilidad con el mapa anterior.
    // No es una evaluación del riesgo realizada por el servidor.
    riesgo: 'normal',
    descripcion: '',
  }
}

function listOf(value: unknown): unknown[] {
  if (Array.isArray(value)) return value

  if (
    isRecord(value) &&
    Array.isArray(value.items)
  ) {
    return value.items
  }

  throw new Error(
    'El backend no devolvió una lista válida de sensores.'
  )
}

function hasSensorId(value: unknown): boolean {
  return (
    isRecord(value) &&
    stringOrEmpty(value.id_sensor).trim() !== ''
  )
}

export const sensorService = {
  async getSensors(): Promise<Sensor[]> {
    const data = await apiFetch<unknown>('/sensores')

    // El listado puede contener menos datos que el detalle.
    return listOf(data).map(mapSensor)
  },

  async getSensorById(
    id: string
  ): Promise<Sensor | undefined> {
    try {
      const data = await apiFetch<unknown>(
        `/sensores/${encodeURIComponent(id)}`
      )

      return mapSensor(data)
    } catch (error) {
      if (
        error instanceof Error &&
        /\b404\b|not found|no encontrado/i.test(
          error.message
        )
      ) {
        return undefined
      }

      throw error
    }
  },

  async createSensor(
    input: CreateSensorInput
  ): Promise<Sensor> {
    const data = await apiFetch<unknown>('/sensores', {
      method: 'POST',
      body: JSON.stringify(input),
    })

    if (!hasSensorId(data)) {
      throw new Error(
        'El servidor respondió sin id_sensor. Actualiza la lista antes de intentar crear de nuevo para evitar duplicados.'
      )
    }

    return mapSensor(data)
  },

  async updateSensor(
    id: string,
    input: UpdateSensorInput
  ): Promise<Sensor> {
    const data = await apiFetch<unknown>(
      `/sensores/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
      }
    )

    if (hasSensorId(data)) {
      return mapSensor(data)
    }

    const current = await this.getSensorById(id)

    if (!current) {
      throw new Error(
        'Se actualizó el sensor, pero el detalle ya no está disponible.'
      )
    }

    return current
  },

  async deleteSensor(id: string): Promise<void> {
    await apiFetch(
      `/sensores/${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    )
  },
}
