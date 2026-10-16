import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readingService } from '../services/reading.service'
import type { Reading } from '../types'

export const useReadingStore = defineStore('reading', () => {
  const readings = ref<Reading[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchReadings = async () => {
    loading.value = true
    error.value = null
    try {
      readings.value = await readingService.getReadings()
    } catch (err) {
      error.value = 'No fue posible obtener las lecturas.'
    } finally {
      loading.value = false
    }
  }

  return { readings, loading, error, fetchReadings }
})
