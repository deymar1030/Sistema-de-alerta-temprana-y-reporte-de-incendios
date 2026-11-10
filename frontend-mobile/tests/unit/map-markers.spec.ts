import { describe, expect, it } from 'vitest'
import { isValidCoordinate, placeMarkers } from '../../src/utils/map-markers'

const point = (lat: number, lng: number, assigned = false, id = 'x') => ({ lat, lng, assigned, data: id })

describe('placeMarkers', () => {
  it('deja intacto un marcador solitario', () => {
    const [m] = placeMarkers([point(-16.5, -68.15)])
    expect([m.displayLat, m.displayLng]).toEqual([-16.5, -68.15])
  })

  it('separa marcadores en la misma coordenada (4 decimales) en un círculo de ~38 m', () => {
    const placed = placeMarkers([point(-16.50001, -68.15001, false, 'a'), point(-16.50002, -68.15002, true, 'b'), point(-16.5, -68.15, false, 'c')])
    expect(placed).toHaveLength(3)
    // la asignada va primero del grupo
    expect(placed[0].data).toBe('b')
    const positions = new Set(placed.map((p) => `${p.displayLat.toFixed(6)},${p.displayLng.toFixed(6)}`))
    expect(positions.size).toBe(3)
    for (const p of placed) {
      const dLat = (p.displayLat - p.lat) * 111320
      const dLng = (p.displayLng - p.lng) * 111320 * Math.cos((p.lat * Math.PI) / 180)
      expect(Math.hypot(dLat, dLng)).toBeGreaterThan(30)
      expect(Math.hypot(dLat, dLng)).toBeLessThan(45)
    }
    // se conserva la ubicación real
    expect(placed.find((p) => p.data === 'b')!.lat).toBe(-16.50002)
  })

  it('no agrupa puntos lejanos', () => {
    const placed = placeMarkers([point(-16.5, -68.15), point(-16.51, -68.16)])
    expect(placed.every((p) => p.displayLat === p.lat && p.displayLng === p.lng)).toBe(true)
  })
})

describe('isValidCoordinate', () => {
  it('rechaza nulos, no numéricos, fuera de rango y 0,0', () => {
    expect(isValidCoordinate(null, -68)).toBe(false)
    expect(isValidCoordinate('abc', -68)).toBe(false)
    expect(isValidCoordinate(95, -68)).toBe(false)
    expect(isValidCoordinate(0, 0)).toBe(false)
    expect(isValidCoordinate('-16.5', '-68.15')).toBe(true)
  })
})
