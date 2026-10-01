export type IsoDateTime = string

export type UserRole = 'CENTRAL_OPERATOR' | 'INSTITUTION_ADMIN' | 'INSTITUTION_USER' | 'CITIZEN'
export type RiskLevel = 'normal' | 'warning' | 'high' | 'critical'
export type InstitutionType = 'BOMBEROS' | 'POLICIA' | 'DEFENSA_CIVIL' | 'RESCATE' | 'OTRA'
export type InstitutionStatus = 'ACTIVA' | 'INACTIVA'
export type InstitutionAvailability = 'DISPONIBLE' | 'ATENDIENDO' | 'NO_DISPONIBLE'
export type SensorType = 'TEMPERATURA' | 'HUMO' | 'CO'
export type SensorStatus = 'ACTIVO' | 'INACTIVO' | 'MANTENIMIENTO' | 'ERROR'
export type ReadingType = 'TEMPERATURA' | 'HUMO' | 'CO'
export type AlertSource = 'SENSOR' | 'CITIZEN_REPORT' | 'MANUAL'
export type AlertStatus = 'ACTIVA' | 'EN_REVISION' | 'RESUELTA' | 'CANCELADA'
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
export type DispatchStatus =
  | 'PENDIENTE'
  | 'ENVIADA'
  | 'RECIBIDA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'EN_CAMINO'
  | 'EN_SITIO'
  | 'CONTROLADA'
  | 'FINALIZADA'
export type CitizenReportStatus = 'RECIBIDO' | 'EN_REVISION' | 'VALIDADO' | 'DESCARTADO' | 'ATENDIDO'
export type NotificationType = 'ALERTA' | 'DESPACHO' | 'ESTADO_INCIDENTE' | 'REPORTE_CIUDADANO' | 'SISTEMA'
export type TimelineEventType =
  | 'DETECCION_RECIBIDA'
  | 'ALERTA_VALIDADA'
  | 'DESPACHO_ENVIADO'
  | 'DESPACHO_ACEPTADO'
  | 'UNIDAD_EN_CAMINO'
  | 'UNIDAD_EN_SITIO'
  | 'INCIDENTE_CONTROLADO'
  | 'INTERVENCION_FINALIZADA'
  | 'INCIDENTE_CERRADO'
  | 'INFORME_REGISTRADO'
export type AttentionReportStatus = 'BORRADOR' | 'PENDIENTE' | 'COMPLETADO' | 'REVISADO'
export type AttachmentType = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp' | 'OTHER'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  institutionId?: string
  phone?: string
  active: boolean
}

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface Location {
  id?: string
  name?: string
  address?: string
  zone?: string
  city: string
  department?: string
  coordinates: Coordinates
}

export interface Institution {
  id: string
  name: string
  type: InstitutionType
  location: Location
  phone?: string
  status: InstitutionStatus
  availability: InstitutionAvailability
}

export interface Sensor {
  id: string
  code: string
  name: string
  type: SensorType
  status: SensorStatus
  model?: string
  manufacturer?: string
  location: Location
  unit?: string
  lastReadingAt?: IsoDateTime
}

export interface Reading {
  id: string
  sensorId: string
  type: ReadingType
  value: number
  unit: string
  timestamp: IsoDateTime
  valid: boolean
}

export interface DetectionResult {
  id: string
  engineVersion: string
  evaluatedAt: IsoDateTime
  riskLevel: RiskLevel
  confidence?: number
  readingIds: string[]
  triggeredRules: string[]
  reason: string
}

export interface Alert {
  id: string
  source: AlertSource
  status: AlertStatus
  riskLevel: RiskLevel
  location: Location
  createdAt: IsoDateTime
  detectionResultId?: string
  citizenReportId?: string
  readingIds?: string[]
  description?: string
}

export interface Dispatch {
  id: string
  incidentId: string
  institutionId: string
  status: DispatchStatus
  sentAt?: IsoDateTime
  receivedAt?: IsoDateTime
  acceptedAt?: IsoDateTime
  enRouteAt?: IsoDateTime
  arrivedAt?: IsoDateTime
  finishedAt?: IsoDateTime
  sentByUserId?: string
}

export interface TimelineEvent {
  id: string
  incidentId: string
  type: TimelineEventType
  timestamp: IsoDateTime
  description: string
  userId?: string
  institutionId?: string
  dispatchId?: string
}

export interface Incident {
  id: string
  alertId: string
  status: IncidentStatus
  riskLevel: RiskLevel
  location: Location
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
  description?: string
  dispatches: Dispatch[]
  timeline: TimelineEvent[]
}

export interface CitizenReport {
  id: string
  citizenId?: string
  description: string
  incidentType: string
  location: Location
  photoUrl?: string
  smokeVisible: boolean
  flamesVisible: boolean
  peopleAtRisk: boolean
  explosions: boolean
  status: CitizenReportStatus
  createdAt: IsoDateTime
}

export interface Notification {
  id: string
  userId?: string
  type: NotificationType
  title: string
  message: string
  createdAt: IsoDateTime
  read: boolean
  relatedEntityId?: string
}

export interface Attachment {
  id: string
  name: string
  type: AttachmentType
  sizeBytes: number
  url?: string
  uploadedAt: IsoDateTime
}

export interface AttentionReport {
  id: string
  incidentId: string
  institutionId: string
  status: AttentionReportStatus
  receivedAt?: IsoDateTime
  departedAt?: IsoDateTime
  arrivedAt?: IsoDateTime
  controlledAt?: IsoDateTime
  finishedAt?: IsoDateTime
  personnelCount?: number
  vehicleCount?: number
  affectedPeople?: number
  evacuatedPeople?: number
  injuredPeople?: number
  deceasedPeople?: number
  damages?: string
  probableCause?: string
  actionsTaken?: string
  observations?: string
  recommendations?: string
  pdfUrl?: string
  attachments?: Attachment[]
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}
