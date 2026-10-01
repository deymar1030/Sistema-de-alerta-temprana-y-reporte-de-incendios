import { reportsMock } from '../mocks/reports'
import type { AttentionReport } from '../types'

export const reportService = {
  async getReports(): Promise<AttentionReport[]> { return reportsMock },
  async createReport(input: Omit<AttentionReport, 'id'>): Promise<AttentionReport> {
    const report = { ...input, id: `INF-${String(reportsMock.length + 1).padStart(3, '0')}` }
    reportsMock.push(report)
    return report
  },
}