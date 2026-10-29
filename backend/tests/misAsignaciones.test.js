import test from 'node:test';
import assert from 'node:assert/strict';
import GetMisAsignacionesUseCase from '../api/application/recepciona/useCases/getMisAsignaciones.useCase.js';

test('MisAsignaciones: resuelve la alerta y su ubicacion por cada asignacion activa', async () => {
  const ahora = new Date('2026-10-27T18:00:00Z');
  const repo = {
    findAsignacionesActivasConAlerta: async (id_usuario) => {
      assert.equal(id_usuario, 2);
      return [{
        id_alerta: 7n,
        fecha_asignacion: ahora,
        alerta: {
          id_alerta: 7n, estado: 'CONFIRMADA', clasificacion: 'INCENDIO',
          fecha: new Date('2026-10-27T00:00:00Z'), hora: ahora,
          lectura: [{ sensor: { predio: { id_predio: 3n, nombre: 'Mercado', latitud: -16.5, longitud: -68.15 } } }],
          genera_ru: [],
        },
      }];
    },
  };
  const useCase = new GetMisAsignacionesUseCase(repo);
  const result = await useCase.execute(2);
  assert.equal(result.length, 1);
  assert.equal(result[0].id_alerta, 7n);
  assert.equal(result[0].alerta.ubicaciones[0].origen, 'PREDIO');
  assert.equal(result[0].alerta.ubicaciones[0].nombre, 'Mercado');
});

test('MisAsignaciones: sin asignaciones activas devuelve lista vacia', async () => {
  const repo = { findAsignacionesActivasConAlerta: async () => [] };
  const useCase = new GetMisAsignacionesUseCase(repo);
  assert.deepEqual(await useCase.execute(2), []);
});
