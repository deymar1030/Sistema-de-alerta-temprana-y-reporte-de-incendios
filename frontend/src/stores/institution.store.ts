import { defineStore } from 'pinia'
import { ref } from 'vue'
import { institutionService } from '../services/institution.service'
import type { Institution } from '../types'

export const useInstitutionStore = defineStore('institution', () => {
  const institutions = ref<Institution[]>([])
  const fetchInstitutions = async () => { institutions.value = await institutionService.getInstitutions() }
  return { institutions, fetchInstitutions }
})