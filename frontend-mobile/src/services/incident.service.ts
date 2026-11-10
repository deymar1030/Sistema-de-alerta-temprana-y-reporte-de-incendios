import type { AlertLocation, EnvioEstado, Incident, RiskLevel } from '../types'
import { API_URL, readBackendError } from './api'
import { parseEnvioEstado, resolveStatus } from './alert-status'
import { sessionService } from './session.service'
import { assignmentService } from './assignment.service'
import { isValidCoordinate } from '../utils/map-markers'

export type EnvioAccion = 'recibir' | 'atender' | 'cerrar'

// Flujo de estados: ENVIADA -> RECIBIDA -> ATENDIDA -> CERRADA
export const ENVIO_ACCIONES: Record<Exclude<EnvioEstado, 'CERRADA'>, { accion: EnvioAccion; label: string }> = {
  ENVIADA: { accion: 'recibir', label: 'CONFIRMAR RECEPCIÓN' },
  RECIBIDA: { accion: 'atender', label: 'MARCAR EN ATENCIÓN' },
  ATENDIDA: { accion: 'cerrar', label: 'FINALIZAR INTERVENCIÓN' },
}

export const siguienteAccion = (estado: EnvioEstado | null | undefined) =>
  estado && estado !== 'CERRADA' ? ENVIO_ACCIONES[estado] : null

const toLocations = (ubicaciones: any): AlertLocation[] => {
  if (!Array.isArray(ubicaciones)) return []
  const seen = new Set<string>()
  const result: AlertLocation[] = []

  for (const item of ubicaciones) {
    if (!isValidCoordinate(item?.latitud, item?.longitud)) continue
    const latitude = Number(item.latitud)
    const longitude = Number(item.longitud)
    const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`
    if (seen.has(key)) continue
    seen.add(key)

    const name = typeof item.nombre === 'string' && item.nombre.trim() ? item.nombre.trim() : null
    const direccion = typeof item.direccion === 'string' && item.direccion.trim() ? item.direccion.trim() : null
    result.push({
      origin: String(item.origen ?? ''),
      reportId: item.id_reporte_u != null ? String(item.id_reporte_u) : null,
      type: item.ubicacion_tipo ?? null,
      name,
      address: direccion ?? name,
      latitude,
      longitude,
    })
  }
  return result
}

const inFlight = new Set<string>()

export const incidentService = {
  getInitialIncidents(): Incident[] {
    return []
  },

  async getIncidents(): Promise<Incident[]> {
    const institutionId = await sessionService.getInstitutionId()
    if (!institutionId) return []

    // La seccion /institucion de esta app es exclusiva de OPERATIVO (ver
    // auth.service.ts: JEFE_INSTITUCION no puede iniciar sesion aqui), asi
    // que todo lo que ve este rol debe acotarse a lo que le asigno su jefe
    // (recepciona.estado = ASIGNADO), nunca a todas las alertas de la
    // institucion -- eso es lo que ve la plataforma web.
    const [response, idsAsignados] = await Promise.all([
      fetch(`${API_URL}/alertas/mapa?id_institucion=${encodeURIComponent(institutionId)}`, {
        method: 'GET',
        credentials: 'include',
      }),
      assignmentService.getIdsAsignados(),
    ])
    if (!response.ok) throw new Error(await readBackendError(response, 'No se pudieron cargar las alertas.'))

    const json = await response.json()
    if (!json.success || !Array.isArray(json.data)) throw new Error('Respuesta inválida del servidor.')

    return json.data
      .filter((item: any) => idsAsignados.has(String(item.id_alerta)))
      .map((item: any): Incident => {
      const envioEstado = parseEnvioEstado(item.mi_envio)
      const locations = toLocations(item.ubicaciones)
      const first = locations[0]

      return {
        id: String(item.id_alerta),
        title: item.clasificacion || 'Emergencia',
        status: resolveStatus(envioEstado, item.estado),
        risk: 'ALTO' as RiskLevel,
        location: first?.type || 'Punto de incendio',
        address: first?.address ?? '',
        description: 'Emergencia reportada y confirmada en el sistema.',
        institutionId,
        institutionName: 'Mi Institución',
        createdAt: item.fecha && item.hora ? `${item.fecha}T${item.hora}Z` : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        distanceKm: 0,
        latitude: first?.latitude ?? 0,
        longitude: first?.longitude ?? 0,
        timeline: [],
        envioEstado,
        locations,
      }
    })
  },

  async ejecutarAccion(id: string, accion: EnvioAccion): Promise<EnvioEstado> {
    if (inFlight.has(id)) throw new Error('Ya hay una acción en curso para esta alerta.')
    inFlight.add(id)

    try {
      const institutionId = await sessionService.getInstitutionId()
      if (!institutionId) throw new Error('No se pudo determinar la institución de tu sesión.')

      const response = await fetch(
        `${API_URL}/alertas/${encodeURIComponent(id)}/instituciones/${encodeURIComponent(institutionId)}/${accion}`,
        { method: 'PATCH', credentials: 'include' },
      ).catch(() => {
        throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.')
      })

      if (!response.ok) throw new Error(await readBackendError(response, 'No se pudo actualizar el estado.'))

      const json = await response.json().catch(() => null)
      
      // Si el backend no devuelve el estado, inferimos el nuevo estado por la acción ejecutada exitosamente
      let nuevoEstado: EnvioEstado = 'ENVIADA';
      if (accion === 'recibir') nuevoEstado = 'RECIBIDA';
      else if (accion === 'atender') nuevoEstado = 'ATENDIDA';
      else if (accion === 'cerrar') nuevoEstado = 'CERRADA';
      
      const estado = parseEnvioEstado(json?.data) || nuevoEstado;
      return estado
    } finally {
      inFlight.delete(id)
    }
  },
}