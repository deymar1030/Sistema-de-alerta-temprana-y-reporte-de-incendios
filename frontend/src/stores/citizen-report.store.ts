import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  citizenReportService,
  type CreateCitizenReportInput,
} from '../services/citizen-report.service'

import type {
  CitizenReport,
  CitizenReportStatus,
} from '../types'

export const useCitizenReportStore =
  defineStore(
    'citizen-report',
    () => {
      const reports =
        ref<CitizenReport[]>([])

      const loading = ref(false)

      const error =
        ref<string | null>(null)

      const fetchReports = async () => {
        loading.value = true
        error.value = null

        try {
          reports.value =
            await citizenReportService.getReports()
        } catch (err) {
          error.value =
            err instanceof Error
              ? err.message
              : 'No fue posible obtener los reportes ciudadanos.'
        } finally {
          loading.value = false
        }
      }

      const getMyReports = async (citizenId?: string) => {
        await fetchReports()
        if (!citizenId) {
          return reports.value
        }
        return reports.value.filter((report) => report.usuarioId === citizenId || report.citizenId === citizenId)
      }

      const createReport = async (
        input: CreateCitizenReportInput,
      ) => {
        const report =
          await citizenReportService.createReport(
            input,
          )

        await fetchReports()

        return report
      }

      const updateStatus = async (
        id: string,
        status: CitizenReportStatus,
      ) => {
        await citizenReportService.updateStatus(
          id,
          status,
        )

        await fetchReports()
      }

      const linkAlert = async (
        id: string,
        alertId: string,
      ) => {
        await citizenReportService.linkAlert(
          id,
          alertId,
        )

        await fetchReports()
      }

      const getReportById = async (
        id: string,
      ) => {
        return citizenReportService.getReportById(
          id,
        )
      }

      return {
        reports,
        loading,
        error,

        fetchReports,
        getMyReports,
        getReportById,

        createReport,
        updateStatus,
        linkAlert,
      }
    },
  )