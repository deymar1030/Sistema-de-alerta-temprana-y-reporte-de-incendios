import { defineStore } from 'pinia'
import { ref } from 'vue'
import { institutionAlertService } from '../services/institution-alert.service'
import type { AlertItem } from '../types'

export const useInstitutionAlertStore = defineStore('institutionAlert', () => {
  const alerts = ref<AlertItem[]>(institutionAlertService.getInitialAlerts())
  const isLoading = ref(false)
  const error = ref('')

  // Ante un fallo se conservan los datos anteriores y se expone el mensaje en `error`.
  const fetchAlerts = async () => {
    isLoading.value = true
    try {
      alerts.value = await institutionAlertService.getAlerts()
      error.value = ''
    } catch (e: any) {
      console.error('Error cargando alertas', e)
      error.value = e?.message || 'No se pudieron cargar las alertas.'
    } finally {
      isLoading.value = false
    }
  }

  const reset = () => {
    alerts.value = []
    error.value = ''
  }

  const activeAlerts = () => alerts.value.filter((item) => item.status !== 'FINALIZADA')

  return {
    alerts,
    isLoading,
    error,
    fetchAlerts,
    reset,
    activeAlerts,
  }
})
