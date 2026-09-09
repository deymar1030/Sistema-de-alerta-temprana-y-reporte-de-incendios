import { defineStore } from 'pinia'
import { ref } from 'vue'
import { detectionService } from '../services/detection.service'
import type { DetectionEngine, RiskAnalysisResult } from '../types'

export const useDetectionStore = defineStore('detection', () => {
  const engine = ref<DetectionEngine | null>(null)
  const riskResult = ref<RiskAnalysisResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchEngine = async () => {
    loading.value = true
    error.value = null
    try {
      engine.value = await detectionService.getDetectionEngine()
    } catch (err) {
      error.value = 'No fue posible obtener el motor de detección.'
    } finally {
      loading.value = false
    }
  }

  const analyzeRisk = async (temperatura: number, humo: number, co: number) => {
    loading.value = true
    error.value = null
    try {
      riskResult.value = await detectionService.analyzeRisk(temperatura, humo, co)
    } catch (err) {
      error.value = 'No fue posible ejecutar el análisis.'
    } finally {
      loading.value = false
    }
  }

  return { engine, riskResult, loading, error, fetchEngine, analyzeRisk }
})
