import { institutionAlerts } from '../mocks/institutionAlerts'
import { storageService } from './storage.service'
import type { AlertItem, AlertStatus, IncidentStatus, RiskLevel } from '../types'

const STORAGE_KEY = 'alerta-mobile-institution-alerts'
const alertStatuses: AlertStatus[] = ['NUEVA', 'RECIBIDA', 'EN_CAMINO', 'EN_SITIO', 'CONTROLADA', 'FINALIZADA']
const riskLevels: RiskLevel[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO']
const alertSources: AlertItem['source'][] = ['sensor', 'citizen', 'manual']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isAlertItem = (value: unknown): value is AlertItem =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  (value.incidentId === undefined || typeof value.incidentId === 'string') &&
  typeof value.type === 'string' &&
  typeof value.location === 'string' &&
  riskLevels.includes(value.risk as RiskLevel) &&
  alertStatuses.includes(value.status as AlertStatus) &&
  typeof value.createdAt === 'string' &&
  !Number.isNaN(Date.parse(value.createdAt)) &&
  typeof value.description === 'string' &&
  typeof value.institutionId === 'string' &&
  typeof value.distanceKm === 'number' &&
  Number.isFinite(value.distanceKm) &&
  alertSources.includes(value.source as AlertItem['source'])

const isAlertList = (value: unknown): value is AlertItem[] => Array.isArray(value) && value.every(isAlertItem)
const mockSnapshot = (): AlertItem[] => institutionAlerts.map((alert) => ({ ...alert }))
const readAlerts = (): AlertItem[] => storageService.read(STORAGE_KEY, mockSnapshot(), isAlertList)

export const institutionAlertService = {
  getInitialAlerts(): AlertItem[] {
    return readAlerts()
  },

  async getAlerts(): Promise<AlertItem[]> {
    return readAlerts()
  },

  async updateStatus(id: string, status: AlertStatus): Promise<AlertItem | undefined> {
    const alerts = readAlerts()
    const item = alerts.find((alert) => alert.id === id)
    if (!item) return undefined
    const updated = { ...item, status }
    const nextAlerts = alerts.map((alert) => alert.id === id ? updated : alert)
    if (!storageService.write(STORAGE_KEY, nextAlerts)) throw new Error('STORAGE_UNAVAILABLE')
    return updated
  },

  async updateByIncidentId(incidentId: string, status: IncidentStatus): Promise<AlertItem | undefined> {
    const alerts = readAlerts()
    const item = alerts.find((alert) => alert.incidentId === incidentId)
    if (!item) return undefined
    const updated = { ...item, status }
    const nextAlerts = alerts.map((alert) => alert.incidentId === incidentId ? updated : alert)
    if (!storageService.write(STORAGE_KEY, nextAlerts)) throw new Error('STORAGE_UNAVAILABLE')
    return updated
  },
}
