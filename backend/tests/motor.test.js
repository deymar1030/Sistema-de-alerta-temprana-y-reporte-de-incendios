import test from 'node:test';
import assert from 'node:assert/strict';
import * as motor from '../api/domain/motorDeteccion/index.js';
import { resolverConfiguracion } from '../api/domain/motorDeteccion/configuracion.js';
import { evaluarPredio, distanciaMetros } from '../api/domain/motorDeteccion/evaluarPredio.js';

const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
const fecha = (min) => new Date(Date.UTC(2026, 0, 1, 0, min));
const lectura = (valor, min) => ({ valor, fecha_hora: fecha(min) });
const parametros = { HUMO: { peso: .30, bmax: 100 }, CO: { peso: .25, bmax: 50 }, TEMPERATURA: { peso: .25, bmax: 10 }, HUMEDAD: { peso: .20, bmax: 10 } };
const clasificar = (extra = {}) => motor.clasificarAlerta({ R: null, umbralConfirmacion: .6, umbralDescarte: .45, ...extra });
const configuracionBD = { id_motordet: 1n, ventana_base_min: 30, umbral_z: 3, cusum_h: 5, umbral_confirmacion: .6,
  umbral_descarte: .45, tiempo_max_evaluacion_min: 10, radio_vecindad_m: 500,
  parametro_variable: ['TEMPERATURA', 'HUMEDAD', 'CO2', 'GAS_LEL'].map((tipo_variable) => ({ tipo_variable, umbral_critico: null })) };

test('Hampel reproduce el ejemplo del PDF, sin modificar la ventana', () => {
  const v = Object.freeze([24.4, 23.6, 24]);
  const r = motor.filtroHampel(v, 40.1, .1, 3);
  cerca(r.z, 27.148625); assert.equal(r.esAnomala, true);
});
test('MAD cero y ausencia de historial son casos distintos', () => {
  cerca(motor.filtroHampel([24, 24, 24], 25, .1, 3).z, 6.745);
  assert.equal(motor.filtroHampel([], 25, .1, 3).z, null);
});
test('CUSUM diferencia pico de subida sostenida y limita la ventana', () => {
  cerca(motor.cusum([4, .2, .1, 0], 5).acumulado, 2.3);
  assert.deepEqual(motor.cusum([2, 2, 2, 2], 5), { acumulado: 6, disparado: true });
  assert.equal(motor.cusum([100, ...Array(20).fill(0)], 5).disparado, false);
  assert.equal(motor.cusum([5.5], 5).disparado, false);
});
test('Theil-Sen calcula por minuto con tiempos desordenados y repetidos', () => {
  cerca(motor.theilSen([lectura(24, 0), lectura(28, 2), lectura(26, 1)]).pendiente, 2);
  assert.deepEqual(motor.theilSen([lectura(24, 0), lectura(26, 0)]), { pendiente: null, calculable: false });
});
test('Vecindad distingue fuego local de cambio comun y admite grupo insuficiente', () => {
  cerca(motor.contrasteVecinos(47, [30, 31, 32], .1).zrob, 10.45475);
  cerca(motor.contrasteVecinos(47, [45, 46, 46], .1).zrob, 1.349);
  assert.equal(motor.contrasteVecinos(47, [30], .1).zrob, null);
});
test('Puntaje reproduce R del PDF sin redondeo previo', () => {
  const r = motor.puntajeAlerta({ HUMO: [{ z: 82.7, b: 60 }], CO: [{ z: 22.3, b: 12 }],
    TEMPERATURA: [{ z: 35.4, b: 2.5, zrob: 33.7 }], HUMEDAD: [{ z: 11.5, b: 4 }] }, parametros);
  cerca(r.R, .7594642857142857);
});
test('Puntaje toma maximo por variable, redistribuye y recorta negativos', () => {
  cerca(motor.puntajeAlerta({ HUMO: [{ z: 0, b: 0 }, { z: 5, b: 100 }] }, parametros).R, 1);
  cerca(motor.puntajeAlerta({ HUMO: [{ z: -5, b: -100, zrob: -7 }] }, parametros).R, 0);
});
test('REGRESION: z/b null, NaN y variable instalada sin datos no producen puntaje cero', () => {
  for (const s of [{ z: null, b: null }, { z: 5, b: null }, { z: NaN, b: 5 }]) {
    const r = motor.puntajeAlerta({ HUMO: [s] }, parametros);
    assert.equal(r.R, null); assert.equal(clasificar({ R: r.R }).estado, 'EN_EVALUACION');
  }
  assert.equal(motor.puntajeAlerta({ HUMO: [{ z: 5, b: 100 }], CO: [] }, parametros).R, null);
  assert.equal(motor.puntajeAlerta({}, parametros).R, null);
});
test('Configuracion invalida falla explicitamente en lugar de producir NaN', () => {
  assert.throws(() => motor.puntajeAlerta({ HUMO: [{ z: 5, b: 100 }] }, { HUMO: {} }));
  assert.throws(() => motor.filtroHampel([1, NaN], 3, 1, 3));
  assert.throws(() => motor.filtroHampel([1], 3, 0, 3));
  assert.throws(() => motor.theilSen([{ valor: 1, fecha_hora: 'invalida' }]));
});
test('Temperatura critica repetida no confirma sin evidencia de combustion', () => {
  assert.equal(clasificar({ valorCriticoActual: true, respaldoCritico: true, humoAnomalo: false, coAnomalo: false }).estado, 'EN_EVALUACION');
  assert.equal(clasificar({ valorCriticoActual: true, respaldoCritico: true, humoAnomalo: true }).estado, 'CONFIRMADA');
});
test('Clasificacion respeta evidencia, limites, prioridad y timeout', () => {
  assert.equal(clasificar({ R: .6, algunSensorCusumDisparado: true, humoAnomalo: true }).estado, 'CONFIRMADA');
  assert.equal(clasificar({ R: .6, algunSensorCusumDisparado: true }).estado, 'EN_EVALUACION');
  assert.equal(clasificar({ R: .45 }).estado, 'EN_EVALUACION');
  assert.equal(clasificar({ R: .44 }).clasificacion, 'SIN_EVIDENCIA');
  assert.equal(clasificar({ R: null, tiempoEvaluacionVencido: true }).estado, 'DESCARTADA');
  assert.equal(clasificar({ unicoSensorAnomalo: true, saltoFisicoImposible: true, otrasVariablesSinCambios: true,
    valorCriticoActual: true, respaldoCritico: true, humoAnomalo: true }).clasificacion, 'FALLA_SENSOR');
});
test('REGRESION: humo/CO desconocidos no equivalen a normales para clima', () => {
  const clima = { mayoriaVecinosAfectados: true, todosZrobBajoUmbral: true };
  assert.equal(clasificar(clima).estado, 'EN_EVALUACION');
  assert.equal(clasificar({ ...clima, gasesNormales: true }).clasificacion, 'CLIMA');
});
test('Configuracion conserva CO2 y GAS_LEL separados de CO y HUMO', () => {
  const c = resolverConfiguracion(configuracionBD);
  assert.deepEqual(Object.keys(c.variables), ['TEMPERATURA', 'HUMEDAD', 'CO2', 'GAS_LEL']);
  assert.equal(c.variables.CO2.umbralCritico, null);
  assert.equal(c.confirmacion.variablesEvidencia.includes('CO2'), false);
  assert.throws(() => resolverConfiguracion(configuracionBD, { confirmacion: { variablesEvidencia: ['CO2'] } }));
  assert.throws(() => resolverConfiguracion(configuracionBD, { variables: { CO2: { peso: 0 } } }));
});
test('Motor conserva gas anomalo en evaluacion sin confirmar incendio', () => {
  const ahora = fecha(12);
  const sensores = ['TEMPERATURA', 'HUMEDAD', 'CO2', 'GAS_LEL'].map((tipo_sensor, i) => {
    const base = [20, 55, 420, 2][i];
    const historial = Array.from({ length: 60 }, (_, j) => ({ valor: base, fecha_hora: new Date(+ahora - 600000 + j * 5000), estado_lectura: 'VALIDA', id_alerta: null }));
    const evento = Array.from({ length: 25 }, (_, j) => ({ valor: i === 2 ? base + j * 80 : base, fecha_hora: new Date(+ahora - 120000 + j * 5000), estado_lectura: 'ANOMALA', id_alerta: 1n }));
    return { id_sensor: BigInt(i + 1), tipo_sensor, lecturas: [...historial, ...evento] };
  });
  const r = evaluarPredio({ sensores, motor: configuracionBD, config: resolverConfiguracion(configuracionBD), ahora,
    alerta: { fecha: fecha(0), hora: fecha(9) } });
  assert.equal(r.sensores[2].anomala, true);
  assert.equal(r.confirmacionDisponible, false);
  assert.notEqual(r.estado, 'CONFIRMADA');
});
test('Haversine y lecturas antiguas no aportan evidencia reciente', () => {
  cerca(distanciaMetros({ latitud: -16.5, longitud: -68.1 }, { latitud: -16.5, longitud: -68.1 }), 0);
  const r = evaluarPredio({ sensores: [{ id_sensor: 1n, tipo_sensor: 'CO2', lecturas: [{ ...lectura(9000, 0), estado_lectura: 'VALIDA', id_alerta: null }] }],
    motor: configuracionBD, config: resolverConfiguracion(configuracionBD), ahora: fecha(20) });
  assert.equal(r.sensores[0].fresca, false); assert.equal(r.puntaje, null);
});

test('Humo critico respaldado puede confirmar durante arranque sin historial', () => {
  const m = { ...configuracionBD, parametro_variable: [{ tipo_variable: 'HUMO', umbral_critico: 500 }] };
  const ahora = fecha(1);
  const r = evaluarPredio({ sensores: [{ id_sensor: 1n, tipo_sensor: 'HUMO', lecturas: [
    { valor: 600, fecha_hora: new Date(+ahora - 5000), estado_lectura: 'ANOMALA', id_alerta: 1n },
    { valor: 650, fecha_hora: ahora, estado_lectura: 'VALIDA', id_alerta: null },
  ] }], motor: m, config: resolverConfiguracion(m), ahora, alerta: { fecha: fecha(0), hora: fecha(1) } });
  assert.equal(r.estado, 'CONFIRMADA'); assert.equal(r.puntaje, null);
});
