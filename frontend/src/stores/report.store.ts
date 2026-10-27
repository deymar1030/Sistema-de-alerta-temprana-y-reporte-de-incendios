
import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  reportService,
  type CreateAttentionReportInput,
  type InformeAtencion,
  type UpdateAttentionReportInput,
} from '../services/report.service'

export const useReportStore = defineStore('report', () => {
  const reports = ref<InformeAtencion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchReports(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      reports.value = await reportService.getReports()
    } catch (cause) {
      reports.value = []

      error.value =
        cause instanceof Error
          ? cause.message
          : 'No fue posible consultar los informes.'
    } finally {
      loading.value = false
    }
  }

  async function createReport(
    input: CreateAttentionReportInput
  ): Promise<string | null> {
    return reportService.createReport(input)
  }

  async function updateReport(
    id: string,
    input: UpdateAttentionReportInput
  ): Promise<void> {
    return reportService.updateReport(id, input)
  }

  function clear(): void {
    reports.value = []
    error.value = null
  }

  return {
    reports,
    loading,
    error,
    fetchReports,
    createReport,
    updateReport,
    clear,
  }
})
