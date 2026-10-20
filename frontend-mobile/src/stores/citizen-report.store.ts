import { defineStore } from 'pinia'
import { ref } from 'vue'
import { citizenReportService } from '../services/citizen-report.service'
import type { CitizenReport, CitizenReportStatus } from '../types'

export const useCitizenReportStore = defineStore('citizenReport', () => {
  const reports = ref<CitizenReport[]>(citizenReportService.getInitialReports())
  const isLoading = ref(false)

  const fetchReports = async () => {
    isLoading.value = true
    try {
      reports.value = await citizenReportService.getReports()
    } finally {
      isLoading.value = false
    }
  }

  const createReport = async (report: Omit<CitizenReport, 'id' | 'createdAt' | 'status'> & { status?: CitizenReportStatus }) => {
    const created = await citizenReportService.createReport(report)
    reports.value = [created, ...reports.value]
    return created
  }

  const updateStatus = async (id: string, status: CitizenReportStatus) => {
    const updated = await citizenReportService.updateStatus(id, status)
    if (!updated) return
    const index = reports.value.findIndex((item) => item.id === id)
    if (index >= 0) reports.value[index] = updated
  }

  return {
    reports,
    isLoading,
    fetchReports,
    createReport,
    updateStatus,
  }
})
