import test from 'node:test'
import assert from 'node:assert/strict'
import { dashboardAlerts, dashboardInstitutions, dashboardPoint } from '../src/utils/dashboard-map.ts'

test('coordenadas: admite números y cadenas, rechaza valores ausentes o imposibles', () => {
  assert.deepEqual(dashboardPoint('-16.5', '-68.1'), [-16.5, -68.1])
  for (const pair of [[null, null], ['', ''], [' ', -68], [true, -68], [NaN, 12], [91, -68], [-16, -181], [0, 0]]) {
    assert.equal(dashboardPoint(...pair), null)
  }
  assert.deepEqual(dashboardPoint(0, -68), [0, -68])
})

test('ADMIN ve instituciones; jefe solo la suya y nunca todas si falta su ID', () => {
  const institutions = [{ id: '1' }, { id: '2' }]
  assert.equal(dashboardInstitutions(institutions, 'admin', null).length, 2)
  assert.deepEqual(dashboardInstitutions(institutions, 'institution', 1), [institutions[0]])
  for (const id of [null, '', ' ', '999']) assert.deepEqual(dashboardInstitutions(institutions, 'institution', id), [])
})

test('el mapa excluye alertas terminadas y conserva todos los estados activos del backend', () => {
  const states = ['EN_EVALUACION', 'CONFIRMADA', 'ATENDIDA', 'CERRADA', 'DESCARTADA', 'CANCELADA']
  const result = dashboardAlerts(states.map((estado, id_alerta) => ({ estado, id_alerta, ubicaciones: [] })))
  assert.deepEqual(result.map(item => item.alert.estado), states.slice(0, 3))
})

test('una alerta puede tener varias ubicaciones sin duplicar puntos ni inventar coordenadas', () => {
  const result = dashboardAlerts([{ id_alerta: 7, estado: 'CONFIRMADA', ubicaciones: [
    { latitud: -16.5, longitud: -68.1, nombre: 'Predio' },
    { latitud: '-16.5', longitud: '-68.1', origen: 'REPORTE' },
    { latitud: -16.6, longitud: -68.2, origen: 'REPORTE' },
    { latitud: null, longitud: null }, null,
  ] }, { id_alerta: 8, estado: 'EN_EVALUACION', ubicaciones: [] }])
  assert.equal(result.length, 2)
  assert.equal(result[0].locations.length, 2)
  assert.equal(result[0].locations[0].name, 'Predio')
  assert.equal(result[1].locations.length, 0)
})
