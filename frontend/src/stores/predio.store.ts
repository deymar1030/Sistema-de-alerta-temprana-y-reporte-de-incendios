import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  predioService,
  type CreatePredioInput,
  type PredioDetail,
  type PredioMapEntry,
} from '../services/predio.service'

export const usePredioStore = defineStore(
  'predio',
  () => {
    const predios = ref<PredioMapEntry[]>([])
    const prediosDetail = ref<PredioDetail[]>([])
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

    const fetchPredios = async () => {
      loading.value = true
      error.value = null

      try {
        prediosDetail.value = await predioService.getPredios()
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : 'No fue posible obtener los predios.'
      } finally {
        loading.value = false
      }
    }

    const createPredio = async (input: CreatePredioInput) => {
      const created = await predioService.createPredio(input)
      prediosDetail.value = [created, ...prediosDetail.value.filter((predio) => String(predio.id_predio) !== String(created.id_predio))]
      return created
    }

    const updatePredio = async (id: string, input: Partial<CreatePredioInput>) => {
      const updated = await predioService.updatePredio(id, input)
      prediosDetail.value = prediosDetail.value.map((predio) => String(predio.id_predio) === String(id) ? { ...predio, ...updated } : predio)
      return updated
    }

    const deletePredio = async (id: string) => {
      await predioService.deletePredio(id)
      prediosDetail.value = prediosDetail.value.filter((predio) => String(predio.id_predio) !== String(id))
    }

    return {
      predios,
      prediosDetail,
      loading,
      error,
      fetchPrediosForMap,
      fetchPredios,
      createPredio,
      updatePredio,
      deletePredio,
    }
  },
)