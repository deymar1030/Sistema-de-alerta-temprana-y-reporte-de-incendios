import { test } from 'node:test'
import assert from 'node:assert/strict'
import { alertDestination, coordinates, deliveryFor, distanceLabel, gapInMeters, isRouteInfo, routeState } from '../src/utils/alert-route.ts'

const route = {
  origin: { latitude: -16.5, longitude: -68.15 },
  destination: { latitude: -16.51, longitude: -68.16 },
  distance_m: 1600,
  geometry: [[-16.5, -68.15], [-16.51, -68.16]],
}

test('selects the institution explicitly, including numeric API identifiers', () => {
  const alert = { instituciones_notificadas: [{ id_institucion: 1, ruta: null }, { id_institucion: 2, ruta: route }] }
  assert.equal(deliveryFor(alert, '2').ruta, route)
  assert.equal(deliveryFor(alert, ''), null)
  assert.equal(deliveryFor(alert, '3'), null)
})

test('rejects malformed geometries without rejecting a single-node route', () => {
  assert.equal(isRouteInfo(route), true)
  for (const geometry of [[], [[91, 0]], [[0, 181]], [[NaN, 0]], [['-16.5', -68]], [null], [[-16.5]], [[-16, -68, 1]]]) {
    assert.equal(isRouteInfo({ ...route, geometry }), false)
  }
  assert.equal(isRouteInfo({ ...route, distance_m: -1 }), false)
  assert.equal(isRouteInfo({ ...route, distance_m: Infinity }), false)
  assert.equal(isRouteInfo({ ...route, origin: null }), false)
  assert.equal(isRouteInfo({ ...route, distance_m: 0, geometry: [[-16.5, -68.15]] }), true)
})

test('distinguishes pending, legacy API, unavailable result, error and invalid route', () => {
  assert.equal(routeState({ ruta: route }), 'ready')
  assert.equal(routeState({ ruta: null, ruta_error: null, ruta_calculada_en: null }), 'pending')
  assert.equal(routeState({}), 'unavailable')
  assert.equal(routeState({ ruta: null, ruta_calculada_en: '2026-11-04T18:00:00Z' }), 'unavailable')
  assert.equal(routeState({ ruta: null, ruta_error: 'No path' }), 'error')
  assert.equal(routeState({ ruta: { ...route, geometry: [] } }), 'invalid')
})

test('preserves latitude/longitude order and does not manufacture missing coordinates', () => {
  assert.deepEqual(coordinates(-16.5, -68.15), [-16.5, -68.15])
  assert.deepEqual(coordinates(0, -68.15), [0, -68.15])
  assert.equal(coordinates(null, -68), null)
  assert.equal(coordinates('', -68), null)
  assert.equal(coordinates('   ', -68), null)
  assert.equal(coordinates(false, -68), null)
  assert.equal(coordinates(100, -68), null)
})

test('falls back to the reported destination when the property has no coordinates', () => {
  assert.deepEqual(alertDestination({ predio: { latitud: null, longitud: null }, reporte_origen: { latitud: -16.5, longitud: -68.15 } }), [-16.5, -68.15])
  assert.equal(alertDestination({}), null)
})

test('formats distance without inventing ETA and detects gaps to the road network', () => {
  assert.equal(distanceLabel(0), '0 m')
  assert.equal(distanceLabel(180), '180 m')
  assert.match(distanceLabel(1600), /^1[.,]6 km$/)
  assert.equal(gapInMeters([-16.5, -68.15], [-16.5, -68.15]), 0)
  assert.ok(gapInMeters([-16.5, -68.15], [-16.501, -68.15]) > 100)
})
