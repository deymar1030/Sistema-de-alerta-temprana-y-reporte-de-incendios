import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  predioService,
  type PredioMapEntry,
} from '../services/predio.service'

export const usePredioStore = defineStore(
  'predio',
  () => {
    const predios = ref<PredioMapEntry[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    const fetchPrediosForMap = async () => {
      loading.value = true
      error.value = null

      try {
        predios.value =
          await predioService.getMapPredios()
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : 'No fue posible obtener los predios.'
      } finally {
        loading.value = false
      }
    }

    return {
      predios,
      loading,
      error,
      fetchPrediosForMap,
    }
  },
)