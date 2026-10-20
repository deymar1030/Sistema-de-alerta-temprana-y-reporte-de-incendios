import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Alert } from '../types'
import { alertService } from '../services/alert.service'

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref<Alert[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAlerts() {
    loading.value = true
    error.value = null

    try {
      alerts.value = await alertService.getAlerts()
      return alerts.value
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar las alertas.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getById(id: string) {
    const existing = alerts.value.find((item) => item.id === id)
    if (existing) return existing
    return await alertService.getAlertById(id)
  }

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    getById,
  }
})
