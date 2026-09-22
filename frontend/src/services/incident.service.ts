import { incidentsMock } from '../mocks/incidents'
import type { CitizenReport, Incident, IncidentStatus } from '../types'

export const incidentService = {
  async getIncidents() { return incidentsMock },
  async updateStatus(id: string, status: IncidentStatus): Promise<Incident | undefined> {
    const incident = incidentsMock.find((item) => item.id === id)
    if (incident) {
      incident.status = status
      incident.updatedAt = new Date().toISOString()
    }
    return incident
  },
  async createFromCitizenReport(report: CitizenReport): Promise<Incident> {
    const incident: Incident = {
      id: `INC-${String(incidentsMock.length + 1).padStart(3, '0')}`,
      alertId: null,
      origen: 'CIUDADANO',
      status: 'EN_VALIDACION',
      riesgo: 'warning',
      ubicacion: report.ubicacion,
      latitud: report.latitud,
      longitud: report.longitud,
      descripcion: report.descripcion,
      createdAt: report.createdAt,
      updatedAt: report.createdAt,
      citizenReportId: report.id,
    }
    incidentsMock.push(incident)
    return incident
  },
}
