import { defineStore } from 'pinia'
import { ref } from 'vue'
import { alertService } from '../services/alert.service'
import type { AlertEntry } from '../types'

export const useAlertStore = defineStore('alert', () => {
  const alerts = ref<AlertEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchAlerts = async () => {
    loading.value = true
    error.value = null
    try {
      alerts.value = await alertService.getAlerts()
    } catch (err) {
      error.value = 'No fue posible obtener las alertas.'
    } finally {
      loading.value = false
    }
  }

  return { alerts, loading, error, fetchAlerts }
})
