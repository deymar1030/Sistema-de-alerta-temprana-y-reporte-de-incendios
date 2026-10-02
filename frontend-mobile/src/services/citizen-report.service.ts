import { citizenReportsMock } from '../mocks/citizenReports'
import { storageService } from './storage.service'
import type { CitizenReport, CitizenReportStatus } from '../types'

const STORAGE_KEY = 'alerta-mobile-citizen-reports'
const reportStatuses: CitizenReportStatus[] = ['RECIBIDO', 'EN_REVISION', 'VALIDADO', 'DESCARTADO', 'ATENDIDO']
const incidentTypes: CitizenReport['incidentType'][] = ['VIVIENDA', 'EDIFICIO', 'VEHICULO', 'VEGETACION', 'COMERCIO', 'OTRO']

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isCitizenReport = (value: unknown): value is CitizenReport =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.description === 'string' &&
  typeof value.type === 'string' &&
  incidentTypes.includes(value.incidentType as CitizenReport['incidentType']) &&
  typeof value.location === 'string' &&
  typeof value.latitude === 'number' &&
  Number.isFinite(value.latitude) &&
  typeof value.longitude === 'number' &&
  Number.isFinite(value.longitude) &&
  typeof value.smokeVisible === 'boolean' &&
  typeof value.fireVisible === 'boolean' &&
  typeof value.peopleAtRisk === 'boolean' &&
  typeof value.explosions === 'boolean' &&
  (value.photo === undefined || typeof value.photo === 'string') &&
  reportStatuses.includes(value.status as CitizenReportStatus) &&
  typeof value.createdAt === 'string' &&
  !Number.isNaN(Date.parse(value.createdAt))

const isCitizenReportList = (value: unknown): value is CitizenReport[] =>
  Array.isArray(value) && value.every(isCitizenReport)

const mockSnapshot = (): CitizenReport[] => citizenReportsMock.map((report) => ({ ...report }))
const readReports = (): CitizenReport[] => storageService.read(STORAGE_KEY, mockSnapshot(), isCitizenReportList)

export const citizenReportService = {
  getInitialReports(): CitizenReport[] {
    return readReports()
  },

  async getReports(): Promise<CitizenReport[]> {
    return readReports()
  },

  async createReport(payload: Omit<CitizenReport, 'id' | 'status' | 'createdAt'> & { status?: CitizenReportStatus }): Promise<CitizenReport> {
    const report: CitizenReport = {
      id: `CR-${Date.now()}`,
      status: payload.status ?? 'RECIBIDO',
      createdAt: new Date().toISOString(),
      ...payload,
    }
    if (!storageService.write(STORAGE_KEY, [report, ...readReports()])) throw new Error('STORAGE_UNAVAILABLE')
    return report
  },

  async updateStatus(id: string, status: CitizenReportStatus): Promise<CitizenReport | undefined> {
    const reports = readReports()
    const report = reports.find((item) => item.id === id)
    if (!report) return undefined
    const updated = { ...report, status }
    if (!storageService.write(STORAGE_KEY, reports.map((item) => item.id === id ? updated : item))) {
      throw new Error('STORAGE_UNAVAILABLE')
    }
    return updated
  },
}
