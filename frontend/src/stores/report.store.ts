import { defineStore } from 'pinia'
import { ref } from 'vue'
import { reportService } from '../services/report.service'
import type { AttentionReport } from '../types'

export const useReportStore = defineStore('report', () => {
  const reports = ref<AttentionReport[]>([])
  const fetchReports = async () => { reports.value = await reportService.getReports() }
  const createReport = async (input: Omit<AttentionReport, 'id'>) => {
    const report = await reportService.createReport(input)
    reports.value = await reportService.getReports()
    return report
  }
  return { reports, fetchReports, createReport }
})
