import type { BackendAlert, InstitutionDelivery, RouteInfo } from '../services/backend-alerts.service'

export type MapPoint = [number, number]
export type RouteState = 'ready' | 'pending' | 'unavailable' | 'error' | 'invalid'

export function coordinates(latitude: unknown, longitude: unknown): MapPoint | null {
  if (latitude == null || longitude == null || latitude === '' || longitude === '') return null
  if (!['number', 'string'].includes(typeof latitude) || !['number', 'string'].includes(typeof longitude)) return null
  if ((typeof latitude === 'string' && !latitude.trim()) || (typeof longitude === 'string' && !longitude.trim())) return null
  const lat = Number(latitude), lng = Number(longitude)
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
    ? [lat, lng] : null
}

export function isRouteInfo(value: unknown): value is RouteInfo {
  if (!value || typeof value !== 'object') return false
  const route = value as Partial<RouteInfo>
  return typeof route.distance_m === 'number' && Number.isFinite(route.distance_m) && route.distance_m >= 0 &&
    typeof route.origin?.latitude === 'number' && typeof route.origin?.longitude === 'number' &&
    typeof route.destination?.latitude === 'number' && typeof route.destination?.longitude === 'number' &&
    coordinates(route.origin.latitude, route.origin.longitude) !== null &&
    coordinates(route.destination.latitude, route.destination.longitude) !== null &&
    Array.isArray(route.geometry) && route.geometry.length > 0 &&
    route.geometry.every(point => Array.isArray(point) && point.length === 2 &&
      typeof point[0] === 'number' && typeof point[1] === 'number' && coordinates(point[0], point[1]) !== null)
}

export function routeState(delivery: InstitutionDelivery | null | undefined): RouteState {
  if (!delivery) return 'unavailable'
  if (delivery.ruta != null) return isRouteInfo(delivery.ruta) ? 'ready' : 'invalid'
  if (delivery.ruta_error) return 'error'
  // An older API can omit the fields entirely. Do not poll an unsupported contract.
  return delivery.ruta === null && delivery.ruta_calculada_en == null ? 'pending' : 'unavailable'
}

export function deliveryFor(alert: BackendAlert, institutionId: string): InstitutionDelivery | null {
  return alert.instituciones_notificadas?.find(item => String(item.id_institucion) === institutionId) ?? null
}

export function alertDestination(alert: BackendAlert): MapPoint | null {
  return coordinates(alert.predio?.latitud, alert.predio?.longitud) ??
    coordinates(alert.reporte_origen?.latitud, alert.reporte_origen?.longitud)
}

export function distanceLabel(meters: number): string {
  const kilometers = meters >= 1000
  return `${new Intl.NumberFormat('es-BO', { maximumFractionDigits: kilometers ? 1 : 0 }).format(kilometers ? meters / 1000 : meters)} ${kilometers ? 'km' : 'm'}`
}

export function dateLabel(value?: string | null): string {
  if (!value) return 'Sin fecha registrada'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Sin fecha registrada' : date.toLocaleString('es-BO')
}

export function gapInMeters(a: MapPoint, b: MapPoint): number {
  const rad = Math.PI / 180
  const h = Math.sin((b[0] - a[0]) * rad / 2) ** 2 +
    Math.cos(a[0] * rad) * Math.cos(b[0] * rad) * Math.sin((b[1] - a[1]) * rad / 2) ** 2
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}
