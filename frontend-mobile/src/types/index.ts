export type UserRole = 'INSTITUTION_USER' | 'CITIZEN'

export type IncidentStatus =
  | 'NUEVA'
  | 'RECIBIDA'
  | 'EN_CAMINO'
  | 'EN_SITIO'
  | 'CONTROLADA'
  | 'FINALIZADA'

export type AlertStatus = 'NUEVA' | 'RECIBIDA' | 'EN_CAMINO' | 'EN_SITIO' | 'CONTROLADA' | 'FINALIZADA'
export type RiskLevel = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'
export type CitizenReportStatus = 'RECIBIDO' | 'EN_REVISION' | 'VALIDADO' | 'DESCARTADO' | 'ATENDIDO'

export type ActionErrorCode = 'CANCELLED' | 'UNAVAILABLE' | 'PERMISSION_DENIED' | 'FAILED' | 'UNSUPPORTED'

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionErrorCode }

export interface LocationData {
  latitude: number
  longitude: number
  label: string
  isDemo: boolean
}

export interface PhotoData {
  dataUrl: string
  format: string
}

export interface User {
  id: string
  name: string
  role: UserRole
  institutionName?: string
  roleLabel: string
}

export interface Location {
  latitude: number
  longitude: number
  label: string
  district: string
}

export interface Attachment {
  name: string
  url?: string
  type: 'image' | 'pdf'
}

export interface Institution {
  id: string
  name: string
  type: string
  phone: string
  address: string
  distanceKm: number
  availability: 'DISPONIBLE' | 'OCUPADO' | 'EN_RUTA'
  latitude: number
  longitude: number
}

export interface AlertItem {
  id: string
  incidentId?: string
  type: string
  location: string
  risk: RiskLevel
  status: AlertStatus
  createdAt: string
  description: string
  institutionId: string
  distanceKm: number
  source: 'sensor' | 'citizen' | 'manual'
}

export type TimelineEventType =
  | 'ALERTA_RECIBIDA'
  | 'RECEPCION_CONFIRMADA'
  | 'UNIDAD_EN_CAMINO'
  | 'LLEGADA_AL_LUGAR'
  | 'INCENDIO_CONTROLADO'
  | 'INTERVENCION_FINALIZADA'

export interface TimelineEvent {
  id: string
  type: TimelineEventType
  timestamp: string
  status: IncidentStatus
}

export interface Incident {
  id: string
  title: string
  status: IncidentStatus
  risk: RiskLevel
  location: string
  address: string
  description: string
  institutionId: string
  institutionName: string
  createdAt: string
  updatedAt: string
  distanceKm: number
  latitude: number
  longitude: number
  timeline: TimelineEvent[]
}

export interface CitizenReport {
  id: string
  description: string
  type: string
  incidentType: 'VIVIENDA' | 'EDIFICIO' | 'VEHICULO' | 'VEGETACION' | 'COMERCIO' | 'OTRO'
  location: string
  latitude: number
  longitude: number
  smokeVisible: boolean
  fireVisible: boolean
  peopleAtRisk: boolean
  explosions: boolean
  photo?: string
  status: CitizenReportStatus
  createdAt: string
}

export interface NotificationItem {
  id: string
  title: string
  description: string
  type: 'info' | 'warning' | 'success'
  date: string
  time: string
}
