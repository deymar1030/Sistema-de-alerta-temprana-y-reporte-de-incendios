import type { AlertItem, RiskLevel } from '../types'
import { API_URL, readBackendError } from './api'
import { parseEnvioEstado, resolveStatus } from './alert-status'
import { sessionService } from './session.service'
import { assignmentService } from './assignment.service'

const normalizeRiskLevel = (value: unknown): RiskLevel => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 0.8) return 'CRITICO'
    if (value >= 0.5) return 'ALTO'
    if (value >= 0.2) return 'MEDIO'
    return 'BAJO'
  }

  const raw = String(value ?? '').trim().toUpperCase()

  if (raw === 'BAJO' || raw === 'LOW' || raw === 'BAJA') return 'BAJO'
  if (raw === 'MEDIO' || raw === 'MEDIA' || raw === 'MODERADO') return 'MEDIO'
  if (raw === 'ALTO' || raw === 'HIGH' || raw === 'ALTA') return 'ALTO'
  if (raw === 'CRITICO' || raw === 'CRITICA' || raw === 'CRITICAL') return 'CRITICO'

  return 'MEDIO'
}

const normalizeSource = (value: unknown): AlertItem['source'] => {
  const raw = String(value ?? '').trim().toLowerCase()
  if (raw === 'sensor' || raw === 'sensors') return 'sensor'
  if (raw === 'citizen' || raw === 'ciudadano' || raw === 'usuario') return 'citizen'
  return 'manual'
}

const normalizeDate = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim()) return value.trim()
  return fallback
}

export const institutionAlertService = {
  getInitialAlerts(): AlertItem[] {
    return []
  },

  // GET /alertas?id_institucion=<id> : Filtra por la institución y trae el estado mi_envio
  async getAlerts(): Promise<AlertItem[]> {
    const institutionId = await sessionService.getInstitutionId()
    if (!institutionId) return []

    // Igual que en incident.service.ts: esta app es exclusiva de OPERATIVO,
    // asi que solo debe listar lo que le asigno su jefe de institucion.
    const [response, idsAsignados] = await Promise.all([
      fetch(`${API_URL}/alertas?id_institucion=${encodeURIComponent(institutionId)}`, {
        method: 'GET',
        credentials: 'include',
      }),
      assignmentService.getIdsAsignados(),
    ])

    if (!response.ok) {
      throw new Error(await readBackendError(response, 'No se pudieron cargar las alertas.'))
    }

    const json = await response.json()
    if (!json.success || !Array.isArray(json.data)) throw new Error('Respuesta inválida del servidor.')

    return json.data
      .filter((item: any) => idsAsignados.has(String(item.id_alerta ?? item.id)))
      .map((item: any): AlertItem => {
      const envioEstado = parseEnvioEstado(item.mi_envio)
      const locations = Array.isArray(item.ubicaciones) ? item.ubicaciones : []
      const loc = locations[0] ?? null
      const fallbackDate = new Date().toISOString()

      const location =
        loc?.direccion ||
        loc?.nombre ||
        loc?.ubicacion_tipo ||
        item.direccion ||
        item.ubicacion ||
        'Ubicación de alerta'

      const distanceKm = Number(item.distancia_km ?? item.distancia ?? item.distanceKm ?? 0)
      const createdAt =
        item.fecha && item.hora
          ? `${item.fecha}T${item.hora}Z`
          : normalizeDate(item.fecha_hora ?? item.created_at ?? item.fecha_confirmacion, fallbackDate)

      return {
        id: String(item.id_alerta ?? item.id ?? 'alerta-sin-id'),
        incidentId: String(item.id_alerta ?? item.id_incidente ?? item.id ?? 'alerta-sin-id'),
        type: item.clasificacion || item.tipo || 'Emergencia',
        location,
        risk: normalizeRiskLevel(item.riesgo ?? item.nivel_riesgo ?? item.risk ?? item.puntaje ?? 'MEDIO'),
        status: resolveStatus(envioEstado, item.estado),
        createdAt,
        description:
          typeof item.descripcion === 'string' && item.descripcion.trim()
            ? item.descripcion.trim()
            : typeof item.mensaje === 'string' && item.mensaje.trim()
              ? item.mensaje.trim()
              : 'Alerta reportada por la institución.',
        institutionId: String(item.id_institucion ?? institutionId),
        distanceKm: Number.isFinite(distanceKm) ? distanceKm : 0,
        source: normalizeSource(item.origen ?? item.source ?? item.tipo_origen),
        envioEstado,
      }
    })
  },
}