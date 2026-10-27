import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMensaje, createMqttMessageHandler } from '../mqtt/subscriber.js';
import { hashMosquitto, leerSimuladores } from '../scripts/provisionar-mqtt.js';
import { pbkdf2Sync } from 'node:crypto';
const payload = (v = {}) => Buffer.from(JSON.stringify({ valor: 20, fecha_hora: '2026-01-01T00:00:00.000Z', ...v }));

test('MQTT conserva IDs bigint y redondea a precision de BD', () => {
  const r = parseMensaje('incendios/8/9007199254740993', payload({ valor: 20.123456 }));
  assert.equal(r.id_sensor, '9007199254740993'); assert.equal(r.valor, 20.1235);
});
test('MQTT rechaza topicos y estructuras invalidas', () => {
  for (const t of ['incendios/0/31', 'incendios/08/31', 'incendios/8/31/x', 'otro/8/31', 'incendios/8/9223372036854775808']) assert.throws(() => parseMensaje(t, payload()));
  for (const p of ['null', '[]', '{}', '{', '{"valor":"5"}']) assert.throws(() => parseMensaje('incendios/8/31', Buffer.from(p)));
  assert.throws(() => parseMensaje('incendios/8/31', payload({ tipo_variable: 'CO' })));
  assert.throws(() => parseMensaje('incendios/8/31', payload({ fecha_hora: '2026-01-01' })));
  assert.throws(() => parseMensaje('incendios/8/31', payload({ fecha_hora: '2026-02-30T00:00:00Z' })));
  assert.throws(() => parseMensaje('incendios/8/31', payload({ fecha_hora: '2026-01-01T24:00:00Z' })));
  assert.throws(() => parseMensaje('incendios/8/31', payload({ valor: 1000000 })));
  assert.throws(() => parseMensaje('incendios/8/31', Buffer.alloc(2049)));
});
test('Mensaje retenido o malformado no ingresa; errores de BD no se ocultan', async () => {
  let llamadas = 0;
  const fn = createMqttMessageHandler(async () => { llamadas++; throw new Error('BD no disponible'); }, { warn() {} });
  await fn('incendios/8/31', payload(), { retain: true }); assert.equal(llamadas, 0);
  await assert.rejects(fn('incendios/8/31', payload()), /BD no disponible/); assert.equal(llamadas, 1);
});
test('Manifest conserva los nueve sensores originales y formato nativo de password', () => {
  const ps = leerSimuladores();
  assert.deepEqual(ps.flatMap((p) => p.sensores.map((s) => s.id_sensor)), [31, 32, 33, 34, 51, 52, 70, 71, 72]);
  const hash = hashMosquitto('prueba-aleatoria');
  const [, version, iter, salt, digest] = hash.split('$');
  assert.equal(version, '7'); assert.equal(Buffer.from(salt, 'base64').length, 12);
  assert.equal(pbkdf2Sync('prueba-aleatoria', Buffer.from(salt, 'base64'), Number(iter), 64, 'sha512').toString('base64'), digest);
});
