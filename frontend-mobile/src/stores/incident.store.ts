import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useInstitutionAlertStore } from './institution-alert.store'
import { incidentService, siguienteAccion } from '../services/incident.service'
import { resolveStatus } from '../services/alert-status'
import type { Incident } from '../types'

export const useIncidentStore = defineStore('incident', () => {
  const incidents = ref<Incident[]>(incidentService.getInitialIncidents())
  const isLoading = ref(false)
  const error = ref('')

  const fetchIncidents = async () => {
    isLoading.value = true
    try {
      incidents.value = await incidentService.getIncidents()
      error.value = ''
    } catch (e: any) {
      console.error('Error cargando emergencias', e)
      error.value = e?.message || 'No se pudieron cargar las emergencias.'
    } finally {
      isLoading.value = false
    }
  }

  // Avanzar flujo de atención operativo por institución
  const avanzarEnvio = async (id: string) => {
    const incident = incidents.value.find((item) => item.id === id)
    const accion = siguienteAccion(incident?.envioEstado)
    if (!incident || !accion) throw new Error('Esta alerta no tiene una acción disponible.')

    const nuevoEstado = await incidentService.ejecutarAccion(id, accion.accion)

    // Se refleja localmente sin recargar toda la lista
    incident.envioEstado = nuevoEstado
    incident.status = resolveStatus(nuevoEstado, incident.status)
    
    // Recargar silenciosamente otros stores si se requiere
    void useInstitutionAlertStore().fetchAlerts()
    
    return nuevoEstado
  }

  const reset = () => {
    incidents.value = []
    error.value = ''
  }

  const pendingIncidents = () => incidents.value.filter((item) => item.envioEstado !== 'CERRADA')
  const resolvedIncidents = () => incidents.value.filter((item) => item.envioEstado === 'CERRADA')

  return {
    incidents,
    isLoading,
    error,
    fetchIncidents,
    avanzarEnvio,
    reset,
    pendingIncidents,
    resolvedIncidents,
  }
})