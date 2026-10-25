import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { CitizenReport } from '../types'
import { citizenReportService } from '../services/citizen-report.service'

export const useCitizenReportStore = defineStore('citizenReport', () => {
  const reports = ref<CitizenReport[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchReports() {
    loading.value = true
    error.value = null

    try {
      reports.value = await citizenReportService.getReports()
      return reports.value
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los reportes.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createReport(payload: Partial<CitizenReport> & { latitude?: number; longitude?: number; id_institucion?: string }) {
    loading.value = true
    error.value = null

    try {
      const item = await citizenReportService.createReport(payload)
      reports.value = [item, ...reports.value]
      return item
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo registrar el reporte.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  function clear() {
    reports.value = []
    loading.value = false
    error.value = null
  }

  return {
    reports,
    loading,
    error,
    clear,
    fetchReports,
    createReport,
  }
})
