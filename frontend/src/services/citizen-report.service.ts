import { citizenReportsMock } from '../mocks/citizenReports'
import type { CitizenReport } from '../types'

export const citizenReportService = {
  async getReports() { return citizenReportsMock },
  async createReport(input: Omit<CitizenReport, 'id' | 'createdAt' | 'status'>): Promise<CitizenReport> {
    const report: CitizenReport = { ...input, id: `REP-${String(citizenReportsMock.length + 1).padStart(3, '0')}`, createdAt: new Date().toISOString(), status: 'RECIBIDO' }
    citizenReportsMock.push(report)
    return report
  },
  async updateStatus(id: string, status: CitizenReport['status']) {
    const report = citizenReportsMock.find((item) => item.id === id)
    if (report) report.status = status
    return report
  },
}