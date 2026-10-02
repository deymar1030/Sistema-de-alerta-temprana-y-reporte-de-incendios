import { incidentsMock } from '../mocks/incidents'
import { storageService } from './storage.service'
import type { Incident, IncidentStatus, RiskLevel, TimelineEvent, TimelineEventType } from '../types'

const STORAGE_KEY = 'alerta-mobile-incidents'
const incidentStatuses: IncidentStatus[] = ['NUEVA', 'RECIBIDA', 'EN_CAMINO', 'EN_SITIO', 'CONTROLADA', 'FINALIZADA']
const riskLevels: RiskLevel[] = ['BAJO', 'MEDIO', 'ALTO', 'CRITICO']
const timelineTypes: TimelineEventType[] = [
  'ALERTA_RECIBIDA',
  'RECEPCION_CONFIRMADA',
  'UNIDAD_EN_CAMINO',
  'LLEGADA_AL_LUGAR',
  'INCENDIO_CONTROLADO',
  'INTERVENCION_FINALIZADA',
]
const nextStatus: Partial<Record<IncidentStatus, IncidentStatus>> = {
  NUEVA: 'RECIBIDA',
  RECIBIDA: 'EN_CAMINO',
  EN_CAMINO: 'EN_SITIO',
  EN_SITIO: 'CONTROLADA',
  CONTROLADA: 'FINALIZADA',
}
const eventByStatus: Partial<Record<IncidentStatus, TimelineEventType>> = {
  RECIBIDA: 'RECEPCION_CONFIRMADA',
  EN_CAMINO: 'UNIDAD_EN_CAMINO',
  EN_SITIO: 'LLEGADA_AL_LUGAR',
  CONTROLADA: 'INCENDIO_CONTROLADO',
  FINALIZADA: 'INTERVENCION_FINALIZADA',
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isTimelineEvent = (value: unknown): value is TimelineEvent =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.timestamp === 'string' &&
  !Number.isNaN(Date.parse(value.timestamp)) &&
  timelineTypes.includes(value.type as TimelineEventType) &&
  incidentStatuses.includes(value.status as IncidentStatus)

const isIncident = (value: unknown): value is Incident =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  incidentStatuses.includes(value.status as IncidentStatus) &&
  riskLevels.includes(value.risk as RiskLevel) &&
  typeof value.location === 'string' &&
  typeof value.address === 'string' &&
  typeof value.description === 'string' &&
  typeof value.institutionId === 'string' &&
  typeof value.institutionName === 'string' &&
  typeof value.createdAt === 'string' &&
  !Number.isNaN(Date.parse(value.createdAt)) &&
  typeof value.updatedAt === 'string' &&
  !Number.isNaN(Date.parse(value.updatedAt)) &&
  typeof value.distanceKm === 'number' &&
  Number.isFinite(value.latitude) &&
  Number.isFinite(value.longitude) &&
  Array.isArray(value.timeline) &&
  value.timeline.every(isTimelineEvent)

const isIncidentList = (value: unknown): value is Incident[] => Array.isArray(value) && value.every(isIncident)

const mockSnapshot = (): Incident[] => incidentsMock.map((incident) => ({ ...incident, timeline: [...incident.timeline] }))
const readIncidents = (): Incident[] => storageService.read(STORAGE_KEY, mockSnapshot(), isIncidentList)

export const incidentService = {
  getInitialIncidents(): Incident[] {
    return readIncidents()
  },

  async getIncidents(): Promise<Incident[]> {
    return readIncidents()
  },

  async updateStatus(id: string, status: IncidentStatus): Promise<Incident | undefined> {
    const incidents = readIncidents()
    const incident = incidents.find((item) => item.id === id)
    if (!incident || nextStatus[incident.status] !== status) return undefined

    const timestamp = new Date().toISOString()
    const event: TimelineEvent = {
      id: `EV-${Date.now()}`,
      type: eventByStatus[status] ?? 'ALERTA_RECIBIDA',
      timestamp,
      status,
    }
    const updated: Incident = {
      ...incident,
      status,
      updatedAt: timestamp,
      timeline: [...incident.timeline, event],
    }
    const nextIncidents = incidents.map((item) => item.id === id ? updated : item)
    if (!storageService.write(STORAGE_KEY, nextIncidents)) throw new Error('STORAGE_UNAVAILABLE')
    return updated
  },
}
