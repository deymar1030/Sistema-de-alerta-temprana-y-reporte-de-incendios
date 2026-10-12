import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  reportService,
  type CreateAttentionReportInput,
  type UpdateAttentionReportInput,
} from '../services/report.service'

import type { AttentionReport } from '../types'

export const useReportStore = defineStore(
  'report',
  () => {
    const reports = ref<AttentionReport[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const fetchReports = async () => {
      loading.value = true
      error.value = null

      try {
        reports.value =
          await reportService.getReports()
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : 'No fue posible obtener los informes.'
      } finally {
        loading.value = false
      }
    }

    const createReport = async (
      input: CreateAttentionReportInput,
    ) => {
      const report =
        await reportService.createReport(input)

      await fetchReports()

      return report
    }

    const updateReport = async (
      id: string,
      input: UpdateAttentionReportInput,
    ) => {
      const report =
        await reportService.updateReport(
          id,
          input,
        )

      await fetchReports()

      return report
    }

    return {
      reports,
      loading,
      error,
      fetchReports,
      createReport,
      updateReport,
    }
  },
)