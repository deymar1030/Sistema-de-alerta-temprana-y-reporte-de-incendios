import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  locationService,
  type GeographicZone,
  type CreateGeographicZonePayload,
  type UpdateGeographicZonePayload,
} from '../services/location.service'

export const useLocationStore =
  defineStore('location', () => {
    const locations =
      ref<GeographicZone[]>([])

    const loading = ref(false)
    const error = ref<string | null>(null)

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
      return locationService.getLocationById(id)
    }

    const createLocation = async (
      payload: CreateGeographicZonePayload,
    ) => {
      error.value = null

      try {
        const created =
          await locationService.createLocation(
            payload,
          )

        await fetchLocations()

        return created
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : 'No fue posible crear la zona.'

        throw err
      }
    }

    const updateLocation = async (
      id: string,
      payload: UpdateGeographicZonePayload,
    ) => {
      error.value = null

      try {
        const updated =
          await locationService.updateLocation(
            id,
            payload,
          )

        await fetchLocations()

        return updated
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : 'No fue posible actualizar la zona.'

        throw err
      }
    }

    const deleteLocation = async (
      id: string,
    ) => {
      error.value = null

      try {
        await locationService.deleteLocation(id)
        await fetchLocations()
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : 'No fue posible eliminar la zona.'

        throw err
      }
    }

    return {
      locations,
      loading,
      error,

      fetchLocations,
      getLocationById,
      createLocation,
      updateLocation,
      deleteLocation,
    }
  })