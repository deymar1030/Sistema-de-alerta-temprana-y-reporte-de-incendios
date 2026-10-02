import { defineStore } from 'pinia'
import { ref } from 'vue'
import { locationsMock } from '../mocks/locations'
import type { LocationEntry } from '../types'

export const useLocationStore = defineStore('location', () => {
  const locations = ref<LocationEntry[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchLocations = async () => {
    loading.value = true
    error.value = null
    try {
      locations.value = [...locationsMock]
    } catch (err) {
      error.value = 'No fue posible obtener las ubicaciones.'
    } finally {
      loading.value = false
    }
  }

  return { locations, loading, error, fetchLocations }
})
