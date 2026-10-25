import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readingService } from '../services/reading.service'
import type { Reading } from '../types'

export const useReadingStore = defineStore('reading', () => {
  const readings = ref<Reading[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const pageSize = ref(100)
  const total = ref(0)

  const fetchReadings = async (requestedPage = page.value) => {
    loading.value = true
    error.value = null
    try {
      const result = await readingService.getReadingsPage(requestedPage, pageSize.value)
      readings.value = result.items
      page.value = result.page
      pageSize.value = result.pageSize
      total.value = result.total
    } catch (err) {
      readings.value = []
      error.value = err instanceof Error ? err.message : 'No fue posible obtener las lecturas.'
    } finally {
      loading.value = false
    }
  }

  return { readings, loading, error, page, pageSize, total, fetchReadings }
})
