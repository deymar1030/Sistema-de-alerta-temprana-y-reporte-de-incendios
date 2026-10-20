export type SensorState = 'Activo' | 'Inactivo' | 'Mantenimiento' | 'Error'
export type AlertState = 'ACTIVA' | 'EN REVISIÓN' | 'RESUELTA'
export type RiskLevel = 'normal' | 'warning' | 'high' | 'critical'
export type InstitutionDeliveryState = 'ENVIADA' | 'RECIBIDA' | 'EN_PROCESO' | 'FALLIDA'

export type UserRole = 'ADMIN' | 'JEFE_INSTITUCION' | 'OPERATIVO' | 'CIUDADANO'

export type WebUserRole = Extract<UserRole, 'ADMIN' | 'JEFE_INSTITUCION' | 'OPERATIVO'>
export const WEB_USER_ROLES: readonly WebUserRole[] = ['ADMIN', 'JEFE_INSTITUCION', 'OPERATIVO']
export const isWebUserRole = (role: UserRole): role is WebUserRole => WEB_USER_ROLES.includes(role as WebUserRole)

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  JEFE_INSTITUCION: 'Administrador de la institución',
  OPERATIVO: 'Personal de la institución',
  CIUDADANO: 'Ciudadano',
}

export const normalizeRole = (value: number | string | UserRole | null | undefined): UserRole => {
  if (typeof value === 'number') {
    switch (value) {
      case 1:
        return 'ADMIN'
      case 2:
        return 'JEFE_INSTITUCION'
      case 3:
        return 'OPERATIVO'
      case 4:
        return 'CIUDADANO'
      default:
        throw new Error(`Rol desconocido: ${value}`)
    }
  }

  const normalized = String(value ?? '').trim().toUpperCase()

  if (normalized === 'ADMIN' || normalized === '1') return 'ADMIN'
  if (normalized === 'JEFE_INSTITUCION' || normalized === '2') return 'JEFE_INSTITUCION'
  if (normalized === 'OPERATIVO' || normalized === '3') return 'OPERATIVO'
  if (normalized === 'CIUDADANO' || normalized === '4') return 'CIUDADANO'

  throw new Error(`Rol desconocido: ${value}`)
}

export const getRoleLabel = (role?: UserRole | null): string => {
  if (!role) return 'Sin rol'
  return ROLE_LABELS[normalizeRole(role)] ?? role
}

export const normalizeStatus = (value: boolean | number | string | null | undefined): 'ACTIVE' | 'INACTIVE' => {
  if (typeof value === 'boolean') return value ? 'ACTIVE' : 'INACTIVE'
  if (typeof value === 'number') return value === 1 ? 'ACTIVE' : 'INACTIVE'
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', 'activo', 'active', 'enabled', '1', 'si', 'sí'].includes(normalized)) return 'ACTIVE'
    if (['false', 'inactivo', 'inactive', 'disabled', '0', 'no'].includes(normalized)) return 'INACTIVE'
  }
  return 'ACTIVE'
}

export const isInstitutionRole = (role?: UserRole | string | null): boolean =>
  normalizeRole(role) === 'JEFE_INSTITUCION' || normalizeRole(role) === 'OPERATIVO'
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
export type CitizenReportStatus =
  | 'PENDIENTE_DE_VALIDACION'
  | 'EN_REVISION'
  | 'CONFIRMADO'
  | 'RECHAZADO'
  | 'ATENDIENDO'
  | 'FINALIZADO'
  | 'RECIBIDO'
  | 'VALIDADO'
  | 'DESCARTADO'
  | 'ATENDIDO'

export interface User {
  id: string
  nombre?: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  city?: string
  role?: UserRole
  rol?: UserRole
  institucionId?: string | null
  institutionId?: string | null
  telefono?: string
  activo?: boolean
  status?: 'ACTIVE' | 'INACTIVE'
  createdAt?: string
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

  // Cantidad real de instituciones notificadas por el backend.
  institucionesNotificadas?: number
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
  citizenId?: string
  usuarioId?: string
  description?: string
  descripcion: string

  tipo?: string
  nivelPrioridad?: string

  address?: string
  ubicacion: string
  latitude?: number
  latitud: number
  longitude?: number
  longitud: number
  reference?: string

  status: CitizenReportStatus
  createdAt: string

  photo?: string
  fotoNombre?: string
  fotoUrl?: string

  factores: string[]

  alertId?: string | null
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
  id_predio?: string
  nombre: string
  tipo_sensor: 'Temperatura' | 'Humo' | 'CO' | 'Humedad'
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
  ultima_lectura: number | null
  descripcion: string
  rango_min?: number
  rango_max?: number
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
