import { defineStore } from 'pinia'
import { ref } from 'vue'
import { institutionAlertService } from '../services/institution-alert.service'
import type { AlertItem, AlertStatus } from '../types'

export const useInstitutionAlertStore = defineStore('institutionAlert', () => {
  const alerts = ref<AlertItem[]>(institutionAlertService.getInitialAlerts())
  const isLoading = ref(false)

  const fetchAlerts = async () => {
    isLoading.value = true
    try {
      alerts.value = await institutionAlertService.getAlerts()
    } finally {
      isLoading.value = false
    }
  }

  const updateStatus = async (id: string, status: AlertStatus) => {
    const updated = await institutionAlertService.updateStatus(id, status)
    if (!updated) return
    const index = alerts.value.findIndex((item) => item.id === id)
    if (index >= 0) alerts.value[index] = updated
  }

  const updateByIncidentId = async (incidentId: string, status: AlertStatus) => {
    const updated = await institutionAlertService.updateByIncidentId(incidentId, status)
    if (!updated) return
    const index = alerts.value.findIndex((item) => item.id === updated.id)
    if (index >= 0) alerts.value[index] = updated
  }

  const activeAlerts = () => alerts.value.filter((item) => item.status !== 'FINALIZADA')

  return {
    alerts,
    isLoading,
    fetchAlerts,
    updateStatus,
    updateByIncidentId,
    activeAlerts,
  }
})
