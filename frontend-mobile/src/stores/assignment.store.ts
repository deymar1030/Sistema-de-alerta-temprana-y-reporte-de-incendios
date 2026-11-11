import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { assignmentService } from '../services/assignment.service'

// Única fuente de las alertas asignadas al operativo: la comparten el mapa, la tarjeta
// de Inicio, la lista de alertas y las tarjetas individuales.
export const useAssignmentStore = defineStore('assignment', () => {
  const assignedIds = ref<string[]>([])
  const idSet = computed(() => new Set(assignedIds.value))

  const fetchAssignments = async () => {
    // getIdsAsignados nunca lanza: ante un fallo devuelve un Set vacío.
    assignedIds.value = [...(await assignmentService.getIdsAsignados())]
  }

  const isAssigned = (id: string) => idSet.value.has(String(id))
  const reset = () => {
    assignedIds.value = []
  }

  return { assignedIds, idSet, fetchAssignments, isAssigned, reset }
})
