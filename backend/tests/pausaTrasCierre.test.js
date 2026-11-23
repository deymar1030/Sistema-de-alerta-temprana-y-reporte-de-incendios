import test from 'node:test';
import assert from 'node:assert/strict';
import { EvaluarLecturaUseCase } from '../api/application/lectura/useCases/evaluarLectura.useCase.js';
import { CONFIGURACION_BASE } from '../api/domain/motorDeteccion/configuracion.js';

const useCase = new EvaluarLecturaUseCase({ repository: {}, notifier: {} });
const ahora = new Date('2026-11-18T12:00:00Z');
const txCon = (cierre) => ({ ultimoCierre: async () => cierre });
const haceMin = (min) => ({ fecha_cierre: new Date(+ahora - min * 60000) });

test('Pausa tras cierre: dura 5 minutos por defecto', () => {
  assert.equal(CONFIGURACION_BASE.reevaluacionTrasCierreMinutos, 5);
});

test('Pausa tras cierre: alerta cerrada hace 2 min bloquea abrir otra', async () => {
  assert.equal(await useCase.enPausaTrasCierre(txCon(haceMin(2)), 1, ahora, CONFIGURACION_BASE), true);
});

test('Pausa tras cierre: pasados los 5 min se vuelve a evaluar', async () => {
  assert.equal(await useCase.enPausaTrasCierre(txCon(haceMin(6)), 1, ahora, CONFIGURACION_BASE), false);
});

test('Pausa tras cierre: predio sin alertas cerradas no tiene pausa', async () => {
  assert.equal(await useCase.enPausaTrasCierre(txCon(null), 1, ahora, CONFIGURACION_BASE), false);
});
