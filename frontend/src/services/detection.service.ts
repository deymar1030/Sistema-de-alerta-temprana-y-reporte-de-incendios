import { detectionEngineMock, riskTimelineMock } from '../mocks/detection'
import type { DetectionEngine, RiskAnalysisResult } from '../types'

export const detectionService = {
  async getDetectionEngine(): Promise<DetectionEngine> {
    await new Promise((resolve) => setTimeout(resolve, 180))
    return { ...detectionEngineMock }
  },

  async analyzeRisk(temperatura: number, humo: number, co: number): Promise<RiskAnalysisResult> {
    await new Promise((resolve) => setTimeout(resolve, 240))

    const risk = Math.min(100, Math.max(0, temperatura * 1.2 + humo * 40 + co * 2.8))
    const level = risk >= 75 ? 'critical' : risk >= 50 ? 'high' : risk >= 30 ? 'warning' : 'normal'
    const description =
      risk >= 75
        ? 'Riesgo crítico: condiciones compatibles con incendio.'
        : risk >= 50
          ? 'Riesgo alto: requiere revisión inmediata.'
          : risk >= 30
            ? 'Advertencia: condiciones elevadas pero controlables.'
            : 'Normal: condiciones dentro del rango observado.'

    return {
      riesgo: Number(risk.toFixed(0)),
      nivel: level,
      descripcion: description,
      timestamp: new Date().toISOString(),
    }
  },

  async getRiskTimeline(): Promise<RiskAnalysisResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 180))
    return [...riskTimelineMock]
  },
}
