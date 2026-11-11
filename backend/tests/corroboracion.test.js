import test from 'node:test';
import assert from 'node:assert/strict';
import { buscarAlertaCorroborable, puntajeCorroborado } from '../api/domain/deteccionImagen/buscarAlertaCorroborable.js';

const LA_PAZ = { latitud: -16.5, longitud: -68.15 };
const CERCA = { latitud: -16.5005, longitud: -68.1505 }; // ~70m
const LEJOS = { latitud: -16.55, longitud: -68.2 }; // ~7km

test('Corroboracion: reporte cercano en tiempo y espacio corrobora la alerta existente', () => {
  const ahora = new Date('2026-10-02T18:00:00Z');
  const candidatos = [{ alerta: { id_alerta: 1n }, ...LA_PAZ, creada_en: new Date('2026-10-02T17:40:00Z') }];
  const match = buscarAlertaCorroborable(candidatos, { ...CERCA, ahora });
  assert.equal(match.alerta.id_alerta, 1n);
});

test('Corroboracion: fuera del radio no corrobora', () => {
  const ahora = new Date('2026-10-02T18:00:00Z');
  const candidatos = [{ alerta: { id_alerta: 1n }, ...LA_PAZ, creada_en: new Date('2026-10-02T17:40:00Z') }];
  assert.equal(buscarAlertaCorroborable(candidatos, { ...LEJOS, ahora }), null);
});

test('Corroboracion: fuera de la ventana de tiempo no corrobora aunque este cerca', () => {
  const ahora = new Date('2026-10-02T18:00:00Z');
  const candidatos = [{ alerta: { id_alerta: 1n }, ...LA_PAZ, creada_en: new Date('2026-10-02T16:00:00Z') }]; // 2h antes
  assert.equal(buscarAlertaCorroborable(candidatos, { ...CERCA, ahora }), null);
});

test('Corroboracion: sin coordenadas en el reporte nuevo no corrobora', () => {
  const ahora = new Date('2026-10-02T18:00:00Z');
  const candidatos = [{ alerta: { id_alerta: 1n }, ...LA_PAZ, creada_en: ahora }];
  assert.equal(buscarAlertaCorroborable(candidatos, { latitud: null, longitud: null, ahora }), null);
});

test('Corroboracion: elige el candidato mas cercano entre varios validos', () => {
  const ahora = new Date('2026-10-02T18:00:00Z');
  const lejanoValido = { latitud: -16.502, longitud: -68.152 }; // ~300m, en el borde
  const candidatos = [
    { alerta: { id_alerta: 1n }, ...lejanoValido, creada_en: ahora },
    { alerta: { id_alerta: 2n }, ...CERCA, creada_en: ahora },
  ];
  const match = buscarAlertaCorroborable(candidatos, { ...LA_PAZ, ahora });
  assert.equal(match.alerta.id_alerta, 2n);
});

test('Corroboracion: puntaje sube con cada corroboracion sin superar 0.99', () => {
  assert.equal(puntajeCorroborado(0.80, 0.70), 0.85);
  assert.equal(puntajeCorroborado(0.97, 0.90), 0.99);
  assert.equal(puntajeCorroborado(null, 0.60), 0.65);
});
