import test from 'node:test';
import assert from 'node:assert/strict';
import { ResponseAlertaDTO } from '../api/domain/alerta/dtos/responseAlerta.dto.js';
import { alcanceAlertas, ESTADOS_VALIDADOS } from '../api/domain/alerta/visibilidadAlerta.js';
import { SocketIoRealtimeNotifier } from '../websocketManager/notifier.js';
import { evaluarPredio } from '../api/domain/motorDeteccion/evaluarPredio.js';
import { resolverConfiguracion } from '../api/domain/motorDeteccion/configuracion.js';

test('Zona horaria: fecha/hora de la alerta salen en hora de Bolivia (UTC-4)', () => {
  // Abierta 2026-11-18 02:30:15 UTC = 2026-11-17 22:30:15 en La Paz.
  const dto = ResponseAlertaDTO.fromEntity({ id_alerta: 1, estado: 'CONFIRMADA',
    fecha: new Date('2026-11-18T00:00:00Z'), hora: new Date('1970-01-01T02:30:15Z') });
  assert.equal(dto.fecha, '2026-11-17');
  assert.equal(dto.hora, '22:30:15');
});

test('Visibilidad: admin ve todo, jefe solo su institucion, ciudadano solo validadas', () => {
  assert.deepEqual(alcanceAlertas({ rol: { nombre_rol: 'ADMIN' } }), { completo: true });
  assert.deepEqual(alcanceAlertas({ rol: { nombre_rol: 'JEFE_INSTITUCION' }, id_institucion: 3n }), { id_institucion: '3' });
  assert.deepEqual(alcanceAlertas({ rol: { nombre_rol: 'OPERATIVO' }, id_institucion: null }), { id_institucion: '-1' });
  assert.deepEqual(alcanceAlertas({ rol: { nombre_rol: 'CIUDADANO' } }), { estados: ESTADOS_VALIDADOS });
  assert.equal(ESTADOS_VALIDADOS.includes('EN_EVALUACION'), false);
});

function ioFalso() {
  const enviados = [];
  const io = {
    emit: (evento) => enviados.push({ destino: 'TODOS', evento }),
    to: (destino) => ({ emit: (evento) => enviados.push({ destino: [destino].flat(), evento }) }),
  };
  return { io, enviados };
}

test('Sockets: alerta EN_EVALUACION solo llega al admin; con pico, tambien a las instituciones notificadas', async () => {
  const { io, enviados } = ioFalso();
  const notifier = new SocketIoRealtimeNotifier(io);
  await notifier.emitAlertaAbierta({ id_alerta: 1, estado: 'EN_EVALUACION' });
  await notifier.emitAlertaActualizada({ id_alerta: 1, estado: 'EN_EVALUACION', instituciones_notificadas: [{ id_institucion: 3 }] });
  await notifier.emitAlertaConfirmada({ id_alerta: 1, estado: 'CONFIRMADA' });
  assert.deepEqual(enviados[0].destino, ['rol:ADMIN']);
  assert.deepEqual(enviados[1].destino, ['rol:ADMIN', 'institucion:3']);
  assert.equal(enviados[2].destino, 'TODOS');
});

const motor = { id_motordet: 1n, ventana_base_min: 30, umbral_z: 3, cusum_h: 5, umbral_confirmacion: .6,
  umbral_descarte: .45, tiempo_max_evaluacion_min: 5, radio_vecindad_m: 500, ventana_correccion_min: 3,
  parametro_variable: [{ tipo_variable: 'TEMPERATURA', umbral_critico: 60, signo: 1 }] };

function sensorTemperatura(base, ultimas) {
  const ahora = new Date(Date.UTC(2026, 0, 1, 1, 0));
  const historial = Array.from({ length: 40 }, (_, i) => ({ valor: base + (i % 2 ? .2 : -.2),
    fecha_hora: new Date(+ahora - (40 + ultimas.length - i) * 15000), estado_lectura: 'VALIDA', id_alerta: null }));
  const recientes = ultimas.map((valor, i) => ({ valor, fecha_hora: new Date(+ahora - (ultimas.length - 1 - i) * 15000),
    estado_lectura: 'VALIDA', id_alerta: null }));
  return { ahora, sensores: [{ id_sensor: 1n, tipo_sensor: 'TEMPERATURA', lecturas: [...historial, ...recientes] }] };
}

test('Motor: una bajada o un pico aislado no abren alerta; una subida sostenida o un valor critico si', () => {
  const config = resolverConfiguracion(motor);
  const evaluar = (ultimas) => {
    const { ahora, sensores } = sensorTemperatura(21, ultimas);
    return evaluarPredio({ sensores, motor, config, ahora }).sensores[0].anomala;
  };
  assert.equal(evaluar([15]), false, 'bajada de temperatura');
  assert.equal(evaluar([21, 21, 24]), false, 'pico aislado');
  assert.equal(evaluar([24, 26, 28, 30]), true, 'subida sostenida');
  assert.equal(evaluar([21, 65]), true, 'valor critico');
});
