import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaDeteccionRepository } from '../../api/infrastructure/features/lectura/repositories/deteccion.repository.impl.js';
import { EvaluarLecturaUseCase } from '../../api/application/lectura/useCases/evaluarLectura.useCase.js';
import { leerSimuladores } from '../../scripts/provisionar-mqtt.js';
import PrismaEnviaRepository from '../../api/infrastructure/features/envia/repositories/envia.repository.impl.js';

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('Definir TEST_DATABASE_URL para una BD local aislada llamada mqtt_detection_test (puerto distinto de 5432)');
const destino = new URL(url);
if (!['localhost', '127.0.0.1'].includes(destino.hostname) || !destino.port || destino.port === '5432' ||
    destino.pathname !== '/mqtt_detection_test' || url === process.env.DATABASE_URL) throw new Error('Se rechazo una BD que no es de pruebas');
const pool = new pg.Pool({ connectionString: url });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const repo = new PrismaDeteccionRepository(prisma);
const t0 = new Date('2026-01-01T12:00:00Z');
let ahora, eventos, useCase;
const notifier = new Proxy({}, { get: (_, metodo) => async (payload) => {
  if (metodo === 'emitLecturaNueva') assert.ok(await prisma.lectura.findUnique({ where: { id_lectura: BigInt(payload.id_lectura) } }), 'Se emitio antes del commit');
  eventos.push([metodo, payload]);
} });
before(async () => {
  if (!(await pool.query("SELECT to_regclass('sensor') AS tabla")).rows[0].tabla) {
    await pool.query(readFileSync(new URL('../../../bd/bd.sql', import.meta.url), 'utf8'));
  }
});
after(async () => { await prisma.$disconnect(); await pool.end(); });
beforeEach(async () => {
  await pool.query('TRUNCATE alerta, zona_geografica, motor_det, institucion, rol RESTART IDENTITY CASCADE');
  await pool.query(readFileSync(new URL('../../mqtt/seed-simuladores.sql', import.meta.url), 'utf8'));
  const baseline = [];
  for (const p of leerSimuladores()) for (const s of p.sensores) {
    for (let i = 0; i < 120; i++) baseline.push({ id_sensor: BigInt(s.id_sensor), valor: s.valor_base,
      fecha_hora: new Date(+t0 - 600000 + i * 5000), estado_lectura: 'VALIDA', tipo_variable: s.tipo_variable });
  }
  await prisma.lectura.createMany({ data: baseline });
  ahora = new Date(t0); eventos = [];
  useCase = new EvaluarLecturaUseCase({ repository: repo, notifier, reloj: () => ahora, logger: { warn() {}, error() {} } });
});
const mensaje = (sensor, valor, fecha = ahora, predio = 8) => ({ id_sensor: String(sensor), id_predio: String(predio), valor, fecha_hora: new Date(fecha) });

test('Persiste lecturas y emite solo despues del commit; duplicados no se repiten', async () => {
  const input = mensaje(31, 20);
  const r = await useCase.execute(input);
  assert.equal(r.lectura.estado_lectura, 'VALIDA'); assert.equal(r.alerta, null);
  assert.equal(eventos.length, 1);
  assert.equal((await useCase.execute(input)).duplicada, true);
  assert.equal(eventos.length, 1);
});
test('Validacion de pertenencia, rango, fechas futuras y orden sin envenenar historial', async () => {
  assert.equal((await useCase.execute(mensaje(31, 20, ahora, 12))).ignorada, 'SENSOR_NO_PERTENECE_AL_PREDIO');
  assert.equal((await useCase.execute(mensaje(31, 999))).lectura.estado_lectura, 'INVALIDA');
  assert.equal((await useCase.execute(mensaje(31, 20, new Date(+ahora + 60000)))).lectura.estado_lectura, 'INVALIDA');
  ahora = new Date(+ahora + 1000);
  assert.equal((await useCase.execute(mensaje(31, 20))).lectura.estado_lectura, 'VALIDA');
  assert.equal((await useCase.execute(mensaje(31, 22, t0))).lectura.estado_lectura, 'INVALIDA');
  assert.equal(await prisma.alerta.count(), 0);
});
test('Dos sensores concurrentes generan una sola alerta por predio y contexto previo', async () => {
  await Promise.all([useCase.execute(mensaje(33, 4000)), useCase.execute(mensaje(34, 25))]);
  assert.equal(await prisma.alerta.count(), 1);
  const alerta = await prisma.alerta.findFirst();
  assert.equal(alerta.estado, 'EN_EVALUACION');
  assert.ok(await prisma.lectura.count({ where: { id_alerta: alerta.id_alerta, fecha_hora: { lt: t0 } } }) > 1);
  assert.equal(eventos.filter(([e]) => e === 'emitAlertaAbierta').length, 1);
  assert.equal(await prisma.envia.count(), 0);
});
test('Timeout funciona sin mensajes y tras reiniciar; cooldown y critico se respetan', async () => {
  const inicial = await useCase.execute(mensaje(33, 4000));
  ahora = new Date(+t0 + 11 * 60000);
  const reiniciado = new EvaluarLecturaUseCase({ repository: repo, notifier, reloj: () => ahora });
  await reiniciado.vencerAlertas();
  const cerrada = await prisma.alerta.findUnique({ where: { id_alerta: inicial.alerta.id_alerta } });
  assert.equal(cerrada.estado, 'DESCARTADA'); assert.ok(cerrada.fecha_cierre);
  ahora = new Date(+ahora + 5000);
  const espera = await useCase.execute(mensaje(33, 4100));
  assert.equal(espera.lectura.estado_lectura, 'ANOMALA'); assert.equal(espera.lectura.id_alerta, null);
  assert.equal(await prisma.alerta.count(), 1);
  ahora = new Date(+ahora + 5000);
  const critico = await useCase.execute(mensaje(31, 80));
  assert.equal(await prisma.alerta.count(), 2); assert.equal(critico.alerta.estado, 'EN_EVALUACION');
});
async function agregarHumo() {
  const p = await prisma.predio.findUnique({ where: { id_predio: 8n } });
  await prisma.parametro_variable.create({ data: { id_motordet: p.id_motordet, tipo_variable: 'HUMO', umbral_critico: 500 } });
  await prisma.sensor.create({ data: { id_sensor: 80n, id_predio: 8n, nombre: 'Solo fixture de prueba', tipo_sensor: 'HUMO', unidad_medida: 'µg/m³', rango_min: 0, rango_max: 5000 } });
  await prisma.lectura.createMany({ data: Array.from({ length: 120 }, (_, i) => ({ id_sensor: 80n, valor: 10,
    fecha_hora: new Date(+t0 - 600000 + i * 5000), estado_lectura: 'VALIDA', tipo_variable: 'HUMO' })) });
  return p;
}
test('Confirmacion validada persiste ENVIA/notificacion una sola vez y mantiene alerta abierta', async () => {
  const p = await agregarHumo();
  const institucion = await prisma.institucion.create({ data: { nombre: 'Fixture bomberos', categoria: 'BOMBEROS', cubre_jurisdiccion: { create: { id_zona: p.id_zona } } } });
  const rol = await prisma.rol.create({ data: { nombre_rol: 'JEFE_INSTITUCION' } });
  await prisma.usuario.create({ data: { nombre: 'Fixture', primer_apellido: 'Jefe', correo: 'fixture@example.invalid', contrasena: 'no-login', id_rol: rol.id_rol, id_institucion: institucion.id_institucion } });
  await useCase.execute(mensaje(80, 600));
  ahora = new Date(+ahora + 5000);
  const r = await useCase.execute(mensaje(80, 650));
  assert.equal(r.alerta.estado, 'CONFIRMADA'); assert.ok(r.alerta.fecha_confirmacion);
  assert.equal(await prisma.envia.count(), 1); assert.equal(await prisma.notificacion.count(), 1);
  ahora = new Date(+ahora + 5000);
  await useCase.execute(mensaje(80, 700));
  assert.equal(await prisma.envia.count(), 1); assert.equal(eventos.filter(([e]) => e === 'emitAlertaConfirmada').length, 1);
});
test('Fallo al distribuir revierte lectura/alerta y no publica eventos', async () => {
  await agregarHumo(); await useCase.execute(mensaje(80, 600));
  ahora = new Date(+ahora + 5000); eventos = [];
  const fallida = new EvaluarLecturaUseCase({ repository: { enPredio: (id, fn) => repo.enPredio(id, (tx) => {
    tx.distribuir = async () => { throw new Error('Fallo simulado'); }; return fn(tx);
  }) }, notifier, reloj: () => ahora });
  await assert.rejects(fallida.execute(mensaje(80, 650)), /Fallo simulado/);
  assert.equal(eventos.length, 0);
  assert.equal(await prisma.lectura.count({ where: { id_sensor: 80n, fecha_hora: ahora } }), 0);
  assert.equal((await prisma.alerta.findFirst()).estado, 'EN_EVALUACION');
});

test('Atencion y cierre institucional liberan el predio para el siguiente episodio', async () => {
  const p = await agregarHumo();
  const institucion = await prisma.institucion.create({ data: { nombre: 'Fixture cierre', categoria: 'BOMBEROS', cubre_jurisdiccion: { create: { id_zona: p.id_zona } } } });
  await useCase.execute(mensaje(80, 600)); ahora = new Date(+ahora + 5000);
  const r = await useCase.execute(mensaje(80, 650));
  const envios = new PrismaEnviaRepository(prisma);
  await envios.updateEstado(r.alerta.id_alerta, institucion.id_institucion, 'RECIBIDA');
  await envios.updateEstado(r.alerta.id_alerta, institucion.id_institucion, 'ATENDIDA');
  assert.equal((await prisma.alerta.findUnique({ where: { id_alerta: r.alerta.id_alerta } })).estado, 'ATENDIDA');
  await envios.updateEstado(r.alerta.id_alerta, institucion.id_institucion, 'CERRADA');
  const cerrada = await prisma.alerta.findUnique({ where: { id_alerta: r.alerta.id_alerta } });
  assert.equal(cerrada.estado, 'CERRADA'); assert.ok(cerrada.fecha_cierre);
  await assert.rejects(envios.updateEstado(r.alerta.id_alerta, institucion.id_institucion, 'RECIBIDA'), /Transicion no permitida/);
  // El motor no reabre la misma alerta ni cierra incendios por caida de la senal.
  ahora = new Date(Date.now() + 1000);
  const siguiente = await useCase.execute(mensaje(80, 700));
  assert.notEqual(siguiente.alerta.id_alerta, cerrada.id_alerta);
  assert.equal(await prisma.alerta.count(), 2);
});
