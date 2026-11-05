import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readingService } from '../services/reading.service'
import type { Reading } from '../types'
import type { ReadingFilters } from '../utils/reading-pagination'

export const useReadingStore = defineStore('reading', () => {
  const readings = ref<Reading[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const page = ref(1)
  const pageSize = ref(25)
  const total = ref(0)

  let requestId = 0
  let controller: AbortController | null = null

  function cancelRequest() {
    requestId++
    controller?.abort()
    controller = null
    loading.value = false
  }

  const fetchReadings = async (requestedPage = page.value, filters: ReadingFilters = {}, requestedSize = pageSize.value) => {
    cancelRequest()
    const current = requestId
    controller = new AbortController()
    const signal = controller.signal
    loading.value = true
    error.value = null
    page.value = requestedPage
    pageSize.value = requestedSize
    try {
      let result = await readingService.getReadingsPage(requestedPage, requestedSize, filters, signal)
      if (current !== requestId) return false
      // Si se eliminaron registros mientras se navegaba, recuperar una página válida.
      if (result.page > Math.max(1, Math.ceil(result.total / result.pageSize))) {
        result = await readingService.getReadingsPage(1, requestedSize, filters, signal)
      }
      if (current !== requestId) return false
      readings.value = result.items
      page.value = result.page
      pageSize.value = result.pageSize
      total.value = result.total
      return true
    } catch (err) {
      if (current !== requestId) return false
      readings.value = []
      total.value = 0
      error.value = err instanceof Error ? err.message : 'No fue posible obtener las lecturas.'
      return false
    } finally {
      if (current === requestId) loading.value = false
    }
  }

  return { readings, loading, error, page, pageSize, total, fetchReadings, cancelRequest }
})
