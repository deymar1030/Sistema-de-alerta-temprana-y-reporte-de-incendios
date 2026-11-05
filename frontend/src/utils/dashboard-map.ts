import type { MapAlert } from '../services/backend-alerts.service'
import type { Institution } from '../types'

export type DashboardScope = 'admin' | 'institution'
export type DashboardPoint = [number, number]

export function dashboardPoint(latitude: unknown, longitude: unknown): DashboardPoint | null {
  const number = (value: unknown) => typeof value === 'number' ? value
    : typeof value === 'string' && value.trim() ? Number(value) : NaN
  const lat = number(latitude)
  const lng = number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null
  return [lat, lng]
}

export function dashboardInstitutions(items: Institution[], scope: DashboardScope, institutionId: string | number | null) {
  if (scope === 'admin') return items
  if (institutionId == null || !String(institutionId).trim()) return []
  return items.filter(item => String(item.id) === String(institutionId))
}

// Mismos estados activos que GET /alertas/mapa. No se usa el estado del envío.
export function dashboardAlerts(items: MapAlert[]) {
  return items.filter(item => ['EN_EVALUACION', 'CONFIRMADA', 'ATENDIDA'].includes(item.estado))
    .map(alert => {
      const seen = new Set<string>()
      const locations = alert.ubicaciones.flatMap(location => {
        if (!location) return []
        const point = dashboardPoint(location.latitud, location.longitud)
        if (!point || seen.has(point.join(','))) return []
        seen.add(point.join(','))
        return [{ point, name: location.nombre || location.origen || 'Ubicación de la alerta' }]
      })
      return { alert, locations }
    })
}
