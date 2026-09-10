export type SensorState = 'Activo' | 'Inactivo' | 'Mantenimiento' | 'Error'
export type AlertState = 'ACTIVA' | 'EN REVISIÓN' | 'RESUELTA'
export type RiskLevel = 'normal' | 'warning' | 'high' | 'critical'
export type InstitutionDeliveryState = 'ENVIADA' | 'RECIBIDA' | 'EN_PROCESO' | 'FALLIDA'

export interface InstitucionNotificada {
  nombre: string
  fecha_envio: string
  hora_envio: string
  estado_envio: InstitutionDeliveryState
}

export interface Sensor {
  id_sensor: string
  nombre: string
  tipo_sensor: 'Temperatura' | 'Humo' | 'CO'
  variable: string
  unidad_medida: string
  modelo: string
  fabricante: string
  fecha_instalacion: string
  estado: SensorState
  ubicacion: string
  lat: number
  lng: number
  riesgo: RiskLevel
  ultima_lectura: number
  descripcion: string
}

export interface Reading {
  id_lectura: string
  id_sensor: string
  sensor: string
  variable: string
  valor: number
  unidad: string
  fecha_hora: string
  estado: 'Normal' | 'Advertencia' | 'Alerta' | 'Crítico'
  riesgo: RiskLevel
}

export interface AlertEntry {
  id_alerta: string
  fecha: string
  hora: string
  nivel: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO'
  estado: AlertState
  id_sensor: string
  sensor: string
  ubicacion: string
  descripcion: string
  lectura_referencia: string
  instituciones_notificadas: InstitucionNotificada[]
}

export interface LocationEntry {
  id_ubicacion: string
  departamento: string
  municipio: string
  zona: string
  descripcion: string
  sensores_instalados: number
  nivel_riesgo: RiskLevel
}

export interface DetectionEngine {
  id: string
  nombre: string
  version: string
  estado: string
  tipo_analisis: string
  sensibilidad: string
  ultima_actualizacion: string
}

export interface RiskAnalysisResult {
  riesgo: number
  nivel: RiskLevel
  descripcion: string
  timestamp: string
}

export interface DemoScenario {
  id: string
  nombre: string
  temperatura: number
  humo: number
  co: number
}
