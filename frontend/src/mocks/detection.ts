import type { DetectionEngine, RiskAnalysisResult } from '../types'

export const detectionEngineMock: DetectionEngine = {
  id: 'DE-01',
  nombre: 'Fire Detection Engine',
  version: '1.0.0',
  estado: 'Activo',
  tipo_analisis: 'Basado en reglas',
  sensibilidad: 'Alta',
  ultima_actualizacion: '2026-09-08T09:15:00',
}

export const riskTimelineMock: RiskAnalysisResult[] = [
  { riesgo: 21, nivel: 'normal', descripcion: 'Sistema estable', timestamp: '2026-09-08T00:00:00' },
  { riesgo: 26, nivel: 'normal', descripcion: 'Variación leve', timestamp: '2026-09-08T02:00:00' },
  { riesgo: 29, nivel: 'normal', descripcion: 'Condiciones normales', timestamp: '2026-09-08T04:00:00' },
  { riesgo: 38, nivel: 'warning', descripcion: 'Riesgo mínimo', timestamp: '2026-09-08T06:00:00' },
  { riesgo: 52, nivel: 'warning', descripcion: 'Aumento moderado', timestamp: '2026-09-08T08:00:00' },
  { riesgo: 65, nivel: 'high', descripcion: 'Alerta técnica', timestamp: '2026-09-08T09:00:00' },
  { riesgo: 78, nivel: 'high', descripcion: 'Riesgo alto detectado', timestamp: '2026-09-08T09:10:00' },
]
