import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { incidentService } from '../services/incident.service'
import type { CitizenReport, Incident, IncidentStatus } from '../types'

export const useIncidentStore = defineStore('incident', () => {
  const incidents = ref<Incident[]>([])
  const activeIncident = computed(() => incidents.value.find((incident) => ['DESPACHADA', 'ACEPTADA', 'EN_CAMINO', 'EN_SITIO', 'CONTROLADA'].includes(incident.status)) ?? incidents.value.find((incident) => !['CERRADA', 'FINALIZADA', 'FALSA_ALARMA'].includes(incident.status)))
  const fetchIncidents = async () => { incidents.value = await incidentService.getIncidents() }
  const updateStatus = async (id: string, status: IncidentStatus) => {
    const updated = await incidentService.updateStatus(id, status)
    incidents.value = await incidentService.getIncidents()
    return updated
  }
  const createFromCitizenReport = async (report: CitizenReport) => {
    const incident = await incidentService.createFromCitizenReport(report)
    incidents.value = await incidentService.getIncidents()
    return incident
  }
  return { incidents, activeIncident, fetchIncidents, updateStatus, createFromCitizenReport }
})
