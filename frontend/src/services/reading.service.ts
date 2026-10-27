import type { Reading, RiskLevel } from '../types'
import { apiFetch } from './http'

interface ApiReading {
  id_lectura: string | number
  id_sensor: string | number
  id_alerta: string | number | null
  valor: number
  fecha_hora: string
  estado_lectura: string
  tipo_variable: string
}

interface PageResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ReadingPage {
  items: Reading[]
  total: number
  page: number
  pageSize: number
}

const UNITS: Record<string, string> = {
  TEMPERATURA: '°C', HUMEDAD: '%', HUMO: 'µg/m³', CO: 'ppm', CO2: 'ppm', GAS_LEL: '%LEL',
}
const LABELS: Record<string, string> = {
  TEMPERATURA: 'Temperatura', HUMEDAD: 'Humedad', HUMO: 'Humo',
  CO: 'CO', CO2: 'CO2', GAS_LEL: 'Gas LEL',
}

function mapApiReading(item: ApiReading): Reading {
  const rawState = item.estado_lectura
  const estado: Reading['estado'] = rawState === 'VALIDA' || rawState === 'ANOMALA' || rawState === 'INVALIDA'
    ? rawState : 'DESCONOCIDO'
  const risk: RiskLevel = estado === 'ANOMALA' ? 'high' : estado === 'VALIDA' ? 'normal' : 'warning'
  return {
    id_lectura: String(item.id_lectura),
    id_sensor: String(item.id_sensor),
    sensor: `Sensor ${item.id_sensor}`,
    variable: LABELS[item.tipo_variable] ?? item.tipo_variable,
    valor: Number(item.valor),
    unidad: UNITS[item.tipo_variable] ?? 'No especificada',
    fecha_hora: item.fecha_hora,
    estado,
    riesgo: risk,
  }
}

export const readingService = {
  /** GET /api/lecturas devuelve un objeto PAGINADO, no un array. */
  async getReadingsPage(page = 1, pageSize = 100, filters: { id_predio?: string; id_sensor?: string } = {}): Promise<ReadingPage> {
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (filters.id_predio) query.set('id_predio', filters.id_predio)
    if (filters.id_sensor) query.set('id_sensor', filters.id_sensor)
    const data = await apiFetch<PageResponse<ApiReading>>(`/lecturas?${query}`)
    if (!data || !Array.isArray(data.items)) throw new Error('Respuesta de lecturas sin data.items.')
    return {
      items: data.items.map(mapApiReading),
      total: data.total,
      page: data.page,
      pageSize: data.pageSize,
    }
  },
  async getReadings(): Promise<Reading[]> {
    return (await readingService.getReadingsPage()).items
  },
  /** Este endpoint, a diferencia del global, devuelve un array. */
  async getReadingsBySensor(sensorId: string): Promise<Reading[]> {
    const data = await apiFetch<ApiReading[]>(`/sensores/${encodeURIComponent(sensorId)}/lecturas`)
    if (!Array.isArray(data)) throw new Error('Respuesta de lecturas del sensor no es una lista.')
    return data.map(mapApiReading)
  },
}
