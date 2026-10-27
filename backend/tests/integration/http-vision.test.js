import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import '../../api/config/bigintJson.js';

test('HTTP: sesion, upload, vision, alerta, instituciones y snapshot', async (t) => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || !url.port || url.port === '5432' || url.pathname !== '/mqtt_detection_test') throw Error('BD no aislada');
  process.env.DATABASE_URL = url.href;
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  // Contrato del servicio ML controlado; la inferencia real se verifica en Python.
  let predicted = 0;
  const ml = http.createServer(async (req, res) => {
    for await (const chunk of req) { assert.ok(chunk.length); }
    predicted++;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ detected: true, label: 'FIRE', fire_probability: .95, no_fire_probability: .05, threshold: .5, warning: null }));
  });
  await new Promise(r => ml.listen(0, '127.0.0.1', r));
  t.after(() => new Promise(r => ml.close(r)));
  process.env.ML_SERVICE_URL = `http://127.0.0.1:${ml.address().port}`;
  const { createApiApp } = await import('../../api/server.js');
  const { default: prisma } = await import('../../api/infrastructure/prismaConfig/prismaClient.js');
  t.after(() => prisma.$disconnect());
  const role = await prisma.rol.upsert({ where: { nombre_rol: 'CIUDADANO' }, update: {}, create: { nombre_rol: 'CIUDADANO' } });
  const user = await prisma.usuario.create({ data: { id_rol: role.id_rol, nombre: 'Fixture HTTP', primer_apellido: 'Vision', correo: `http-${Date.now()}@example.invalid`, contrasena: 'no-login' } });
  const token = 'fixture-http-vision-' + Date.now();
  await prisma.sesion.create({ data: { id_usuario: user.id_usuario, token_hash: createHash('sha256').update(token).digest('hex'), expira_en: new Date(Date.now() + 60000) } });
  await prisma.institucion.create({ data: { nombre: 'HTTP sin zona', categoria: 'BOMBEROS' } });
  const app = createApiApp();
  const server = await new Promise(r => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
  t.after(() => new Promise(r => server.close(r)));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const headers = { Cookie: `sid=${token}`, Origin: 'http://localhost:5173' };
  assert.equal((await fetch(`${base}/predios/8/deteccion`)).status, 401);
  assert.equal((await fetch(`${base}/predios/invalid/deteccion`, { headers })).status, 400);
  assert.equal((await fetch(`${base}/predios/999999/deteccion`, { headers })).status, 404);
  const snapshot = await fetch(`${base}/predios/8/deteccion`, { headers });
  assert.equal(snapshot.status, 200);
  assert.equal((await snapshot.json()).data.id_predio, '8');
  const form = new FormData();
  form.append('archivo', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZfoAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'fixture.png');
  const upload = await fetch(`${base}/archivos`, { method: 'POST', headers, body: form });
  assert.equal(upload.status, 201);
  const photo = (await upload.json()).data.url;
  t.after(() => unlink(new URL(`../../uploads/reportes-usuario/${photo.split('/').at(-1)}`, import.meta.url)));
  const response = await fetch(`${base}/reportes-usuario`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({
    id_usuario: '999999', descripcion: 'Prueba HTTP vision', foto_url: photo, latitud: -16.5, longitud: -68.1, ubicacion_tipo: 'CERCANA',
  }) });
  assert.equal(response.status, 201, await response.clone().text());
  const report = (await response.json()).data;
  assert.equal(report.id_usuario, String(user.id_usuario));
  assert.equal(report.alerta_vinculada.estado, 'CONFIRMADA');
  assert.equal(predicted, 1);
  const ownReports = await (await fetch(`${base}/reportes-usuario?id_usuario=999999`, { headers })).json();
  assert.ok(ownReports.data.length > 0);
  assert.ok(ownReports.data.every(item => item.id_usuario === String(user.id_usuario)));
  const alert = (await (await fetch(`${base}/alertas/${report.alerta_vinculada.id_alerta}`, { headers })).json()).data;
  assert.equal(alert.reporte_origen.foto_url, photo);
  assert.equal(alert.instituciones_notificadas.length, await prisma.institucion.count());
  assert.equal((await fetch(`${base}/instituciones/1/jurisdicciones`, { headers })).status, 404);
});
