import test from 'node:test'
import assert from 'node:assert/strict'
import { readingQuery, readingPagination } from '../src/utils/reading-pagination.ts'

test('envía filtros al servidor antes de paginar, con nombres y valores del contrato REST', () => {
  const query = readingQuery(2, 25, { id_sensor: '42', tipo_variable: 'TEMPERATURA', estado_lectura: 'ANOMALA', id_predio: '3' })
  assert.deepEqual(Object.fromEntries(query), { page: '2', pageSize: '25', id_predio: '3', id_sensor: '42', tipo_variable: 'TEMPERATURA', estado_lectura: 'ANOMALA' })
})

test('Todos no envía ningún filtro y la consulta mantiene tamaño y página explícitos', () => {
  assert.equal(readingQuery(1, 50, { id_sensor: '', tipo_variable: ' ' }).toString(), 'page=1&pageSize=50')
  assert.equal(readingQuery(3, 100, { id_sensor: 'a&b' }).get('id_sensor'), 'a&b')
})

test('rechaza páginas fraccionarias o inválidas en lugar de pedir un registro por error', () => {
  for (const [page, size] of [[0, 25], [-1, 25], [1.5, 25], [1, 0], [NaN, 25], [1, Infinity]]) {
    assert.throws(() => readingQuery(page, size))
  }
})

test('respeta el total filtrado y permite la última página incompleta y un resultado vacío', () => {
  assert.deepEqual(readingPagination({ page: '2', pageSize: '25', total: '40' }, 15), { page: 2, pageSize: 25, total: 40 })
  assert.deepEqual(readingPagination({ page: 1, pageSize: 25, total: 0 }, 0), { page: 1, pageSize: 25, total: 0 })
  assert.equal(readingPagination({ page: 4, pageSize: 25, total: 3 }, 0).page, 4)
})

test('metadatos ausentes o inconsistentes no habilitan navegación incorrecta', () => {
  for (const metadata of [
    { page: 1, pageSize: 0, total: 2 }, { page: null, pageSize: 25, total: 2 },
    { page: 1, pageSize: 25, total: -1 }, { page: 1, pageSize: 25, total: undefined },
    { page: 1, pageSize: 25, total: 0 }, { page: 1, pageSize: 1, total: 5 },
  ]) assert.throws(() => readingPagination(metadata, 2))
})
