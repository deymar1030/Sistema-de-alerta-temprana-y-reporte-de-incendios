import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useInstitutionAlertStore } from './institution-alert.store'
import { incidentService } from '../services/incident.service'
import type { Incident, IncidentStatus } from '../types'

export const useIncidentStore = defineStore('incident', () => {
  const incidents = ref<Incident[]>(incidentService.getInitialIncidents())
  const isLoading = ref(false)

  const fetchIncidents = async () => {
    isLoading.value = true
    try {
      incidents.value = await incidentService.getIncidents()
    } finally {
      isLoading.value = false
    }
  }

  const updateStatus = async (id: string, status: IncidentStatus) => {
    const updated = await incidentService.updateStatus(id, status)
    if (!updated) return
    const index = incidents.value.findIndex((item) => item.id === id)
    if (index >= 0) incidents.value[index] = updated
    await useInstitutionAlertStore().updateByIncidentId(id, updated.status)
    return updated
  }

  const pendingIncidents = () => incidents.value.filter((item) => item.status !== 'FINALIZADA')
  const resolvedIncidents = () => incidents.value.filter((item) => item.status === 'FINALIZADA')

  return {
    incidents,
    isLoading,
    fetchIncidents,
    updateStatus,
    pendingIncidents,
    resolvedIncidents,
  }
})
