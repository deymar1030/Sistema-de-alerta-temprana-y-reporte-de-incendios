export interface MarkerInput<T> {
  lat: number
  lng: number
  assigned: boolean
  data: T
}

export interface PlacedMarker<T> extends MarkerInput<T> {
  displayLat: number
  displayLng: number
}

const METERS_PER_DEGREE = 111320

export const isValidCoordinate = (lat: unknown, lng: unknown): boolean => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) return false
  const la = Number(lat)
  const lo = Number(lng)
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return false
  if (la < -90 || la > 90 || lo < -180 || lo > 180) return false
  return !(la === 0 && lo === 0)
}

// Agrupa por coordenadas redondeadas a 4 decimales (~11 m) y reparte cada grupo
// sobre un círculo pequeño alrededor del punto real. La alerta asignada va primero.
export const placeMarkers = <T>(points: MarkerInput<T>[], radiusMeters = 38): PlacedMarker<T>[] => {
  const groups = new Map<string, MarkerInput<T>[]>()
  for (const point of points) {
    const key = `${point.lat.toFixed(4)},${point.lng.toFixed(4)}`
    const group = groups.get(key)
    if (group) group.push(point)
    else groups.set(key, [point])
  }

  const placed: PlacedMarker<T>[] = []
  for (const group of groups.values()) {
    const ordered = [...group].sort((a, b) => Number(b.assigned) - Number(a.assigned))

    if (ordered.length === 1) {
      const [only] = ordered
      placed.push({ ...only, displayLat: only.lat, displayLng: only.lng })
      continue
    }

    const centerLat = ordered.reduce((sum, item) => sum + item.lat, 0) / ordered.length
    const centerLng = ordered.reduce((sum, item) => sum + item.lng, 0) / ordered.length
    const metersPerLng = METERS_PER_DEGREE * Math.max(Math.cos((centerLat * Math.PI) / 180), 0.01)

    ordered.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / ordered.length
      placed.push({
        ...item,
        displayLat: centerLat + (radiusMeters * Math.cos(angle)) / METERS_PER_DEGREE,
        displayLng: centerLng + (radiusMeters * Math.sin(angle)) / metersPerLng,
      })
    })
  }

  return placed
}
