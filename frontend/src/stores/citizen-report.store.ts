import { defineStore } from 'pinia'
import { ref } from 'vue'
import { citizenReportService } from '../services/citizen-report.service'
import type { CitizenReport } from '../types'

export const useCitizenReportStore = defineStore('citizen-report', () => {
  const reports = ref<CitizenReport[]>([])
  const fetchReports = async () => { reports.value = await citizenReportService.getReports() }
  const createReport = async (input: Omit<CitizenReport, 'id' | 'createdAt' | 'status'>) => {
    const report = await citizenReportService.createReport(input)
    reports.value = await citizenReportService.getReports()
    return report
  }
  const updateStatus = async (id: string, status: CitizenReport['status']) => {
    await citizenReportService.updateStatus(id, status)
    reports.value = await citizenReportService.getReports()
  }
  return { reports, fetchReports, createReport, updateStatus }
})
