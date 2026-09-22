export type SensorState = 'Activo' | 'Inactivo' | 'Mantenimiento' | 'Error'
export type AlertState = 'ACTIVA' | 'EN REVISIÓN' | 'RESUELTA'
export type RiskLevel = 'normal' | 'warning' | 'high' | 'critical'
export type InstitutionDeliveryState = 'ENVIADA' | 'RECIBIDA' | 'EN_PROCESO' | 'FALLIDA'

export type UserRole = 'CENTRAL_OPERATOR' | 'INSTITUTION_ADMIN' | 'INSTITUTION_USER' | 'CITIZEN'
export type IncidentStatus =
  | 'NUEVA'
  | 'EN_VALIDACION'
  | 'VALIDADA'
  | 'DESPACHADA'
  | 'ACEPTADA'
  | 'EN_CAMINO'
  | 'EN_SITIO'
  | 'CONTROLADA'
  | 'FINALIZADA'
  | 'CERRADA'
  | 'RECHAZADA'
  | 'FALSA_ALARMA'
  | 'CANCELADA'
export type DispatchStatus = 'PENDIENTE' | 'ENVIADA' | 'RECIBIDA' | 'ACEPTADA' | 'RECHAZADA' | 'EN_CAMINO' | 'EN_SITIO' | 'CONTROLADA' | 'FINALIZADA'
export type ReportStatus = 'BORRADOR' | 'PENDIENTE' | 'COMPLETADO' | 'REVISADO'
export type CitizenReportStatus = 'RECIBIDO' | 'EN_REVISION' | 'VALIDADO' | 'DESCARTADO' | 'ATENDIDO'

export interface User {
  id: string
  nombre: string
  email: string
  rol: UserRole
  institucionId: string | null
  telefono?: string
  activo?: boolean
}

export interface Institution {
  id: string
  nombre: string
  tipo: string
  direccion: string
  latitud: number
  longitud: number
  telefono: string
  estado: 'ACTIVA' | 'INACTIVA'
  disponibilidad: 'DISPONIBLE' | 'ATENDIENDO' | 'NO_DISPONIBLE'
  distanciaDemo: number
}

export interface Incident {
  id: string
  alertId: string | null
  origen: 'SENSOR' | 'CIUDADANO'
  status: IncidentStatus
  riesgo: RiskLevel
  ubicacion: string
  latitud: number
  longitud: number
  descripcion: string
  createdAt: string
  updatedAt?: string
  citizenReportId?: string
}

export interface Alert {
  id: string
  incidentId: string
  origen: 'SENSOR' | 'CIUDADANO'
  tipo: string
  ubicacion: string
  riesgo: RiskLevel
  estado: IncidentStatus
  evidenciaDisponible: boolean
  createdAt: string
  descripcion: string
}

export interface Dispatch {
  id: string
  incidentId: string
  alertId: string
  institutionId: string
  sentBy: string
  sentAt: string
  updatedAt: string
  status: DispatchStatus
}

export interface CitizenReport {
  id: string
  descripcion: string
  ubicacion: string
  latitud: number
  longitud: number
  status: CitizenReportStatus
  createdAt: string
  fotoNombre?: string
  fotoUrl?: string
  factores: string[]
}

export interface Attachment {
  id: string
  nombre: string
  tipo: string
  tamano: number
  fecha: string
}

export interface AttentionReport {
  id: string
  incidentId: string
  institutionId: string
  status: ReportStatus
  fechaIncidente: string
  horaRecepcion: string
  horaSalida: string
  horaLlegada: string
  horaControl: string
  horaFinalizacion: string
  personal: number
  vehiculos: number
  personasAfectadas: number
  personasEvacuadas: number
  heridos: number
  fallecidos: number
  danosMateriales: string
  causa: string
  acciones: string
  observaciones: string
  recomendaciones: string
  attachments: Attachment[]
}

export interface IncidentTimelineEvent {
  id: string
  incidentId: string
  dispatchId?: string
  institutionId?: string
  estado: IncidentStatus | DispatchStatus
  titulo: string
  detalle: string
  createdAt: string
  actor: string
}

export interface AuditLog {
  id: string
  usuario: string
  accion: string
  fecha: string
  incidenteId?: string
  detalle: string
}

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
