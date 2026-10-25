import { defineStore } from 'pinia'
import { ref } from 'vue'
import { institutionService, type InstitutionInput } from '../services/institution.service'
import type { Institution } from '../types'

export const useInstitutionStore = defineStore('institution', () => {
  const institutions = ref<Institution[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  const fetchInstitutions = async () => {
    loading.value = true
    error.value = null
    try {
      institutions.value = await institutionService.getInstitutions()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'No se pudieron cargar las instituciones.'
      institutions.value = []
    } finally {
      loading.value = false
    }
  }

  const saveInstitution = async (payload: InstitutionInput, id?: string) => {
    saving.value = true
    try {
      if (id) await institutionService.updateInstitution(id, payload)
      else await institutionService.createInstitution(payload)
      await fetchInstitutions()
    } finally {
      saving.value = false
    }
  }

  return { institutions, loading, saving, error, fetchInstitutions, saveInstitution }
})
