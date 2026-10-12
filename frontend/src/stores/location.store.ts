import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  locationService,
  type GeographicZone,
} from '../services/location.service'

export const useLocationStore =
  defineStore('location', () => {
    const locations =
      ref<GeographicZone[]>([])

    const loading = ref(false)

    const error =
      ref<string | null>(null)

    const fetchLocations = async () => {
      loading.value = true
      error.value = null

      try {
        locations.value =
          await locationService.getLocations()
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : 'No fue posible obtener las zonas geográficas.'
      } finally {
        loading.value = false
      }
    }

    const getLocationById = async (
      id: string,
    ) => {
      return locationService.getLocationById(
        id,
      )
    }

    return {
      locations,
      loading,
      error,

      fetchLocations,
      getLocationById,
    }
  })