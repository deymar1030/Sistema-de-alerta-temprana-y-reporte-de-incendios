import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import http from 'node:http';
import net from 'node:net';
import { once } from 'node:events';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import mqtt from 'mqtt';
import { Server } from 'socket.io';
import { io as conectarSocket } from 'socket.io-client';
import { provisionar } from '../../scripts/provisionar-mqtt.js';
import { configuracionLocal } from '../../scripts/iniciar-mosquitto.js';
import { PrismaDeteccionRepository } from '../../api/infrastructure/features/lectura/repositories/deteccion.repository.impl.js';
import { EvaluarLecturaUseCase } from '../../api/application/lectura/useCases/evaluarLectura.useCase.js';
import { startMqttSubscriber } from '../../mqtt/bootstrap.js';
import { connectMqttClient } from '../../mqtt/client.js';
import { createMqttMessageHandler } from '../../mqtt/subscriber.js';
import { createSocketAuth } from '../../websocketManager/auth.js';
import { registerConnectionManager } from '../../websocketManager/connectionManager.js';
import { SocketIoRealtimeNotifier } from '../../websocketManager/notifier.js';
import { SESSION_COOKIE_NAME } from '../../api/config/sessionCookie.js';
import '../../api/config/bigintJson.js';

const esperar = async (condicion, timeout = 10000) => {
  const limite = Date.now() + timeout;
  while (!(await condicion())) {
    if (Date.now() > limite) throw new Error('Timeout esperando condicion de integracion');
    await new Promise((r) => setTimeout(r, 25));
  }
};

test('Mosquitto real: autenticacion, ACL, persistencia, reconexion, Python y WebSocket', { timeout: 60000 }, async (t) => {
  if (!process.env.MOSQUITTO_BIN) { t.skip('Definir MOSQUITTO_BIN para probar el broker real'); return; }
  const url = process.env.TEST_DATABASE_URL;
  const destino = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(destino.hostname) || !destino.port || destino.port === '5432' ||
      destino.pathname !== '/mqtt_detection_test' || url === process.env.DATABASE_URL) throw new Error('BD no aislada');
  const pool = new pg.Pool({ connectionString: url });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  t.after(async () => { await prisma.$disconnect(); await pool.end(); });
  if (!(await pool.query("SELECT to_regclass('sensor') AS tabla")).rows[0].tabla) await pool.query(readFileSync(new URL('../../../bd/bd.sql', import.meta.url), 'utf8'));
  await pool.query('TRUNCATE alerta, zona_geografica, motor_det, institucion, rol RESTART IDENTITY CASCADE');
  await pool.query(readFileSync(new URL('../../mqtt/seed-simuladores.sql', import.meta.url), 'utf8'));
  const pruebaPuerto = net.createServer();
  await new Promise((r) => pruebaPuerto.listen(0, '127.0.0.1', r));
  const puerto = pruebaPuerto.address().port;
  await new Promise((r) => pruebaPuerto.close(r));
  const brokerUrl = `mqtt://127.0.0.1:${puerto}`;
  const carpetaBase = fileURLToPath(new URL('../../.runtime/', import.meta.url));
  mkdirSync(carpetaBase, { recursive: true });
  const carpeta = mkdtempSync(join(carpetaBase, 'broker-test-'));
  provisionar({ output: carpeta, brokerUrl });
  const credenciales = JSON.parse(readFileSync(join(carpeta, 'credentials.private.json'), 'utf8'));
  const conf = join(carpeta, 'mosquitto.conf');
  mkdirSync(join(carpeta, 'data'));
  writeFileSync(conf, configuracionLocal(carpeta, puerto));
  const broker = spawn(process.env.MOSQUITTO_BIN, ['-c', conf], { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let brokerLog = '', brokerError;
  broker.stdout.on('data', (x) => { brokerLog += x; }); broker.stderr.on('data', (x) => { brokerLog += x; });
  broker.on('error', (e) => { brokerError = e; });
  t.after(() => broker.kill());
  await esperar(() => {
    if (brokerError) throw brokerError;
    if (broker.exitCode != null) throw new Error(brokerLog);
    return new Promise((r) => {
      const probe = net.connect(puerto, '127.0.0.1');
      probe.once('connect', () => { probe.destroy(); r(true); });
      probe.once('error', () => { probe.destroy(); r(false); });
    });
  });

  const invalid = mqtt.connect(brokerUrl, { username: 'predio-8', password: 'incorrecta', reconnectPeriod: 0, clientId: 'invalid-test' });
  t.after(() => invalid.end(true));
  const [rechazo] = await once(invalid, 'error'); assert.match(rechazo.message, /authoriz|Connection refused/i);
  const anonimo = mqtt.connect(brokerUrl, { reconnectPeriod: 0, clientId: 'anonymous-test' });
  t.after(() => anonimo.end(true));
  await once(anonimo, 'error');

  const httpServer = http.createServer(); const io = new Server(httpServer);
  t.after(async () => { await new Promise((r) => io.close(r)); });
  const validateSesion = { async execute(token) {
    if (token !== 'test-session') throw new Error('No autenticado');
    return { usuario: { id_usuario: 1n, id_rol: 1n }, sesion: { expira_en: new Date(Date.now() + 60000) } };
  } };
  io.use(createSocketAuth(validateSesion));
  registerConnectionManager(io, { validateSesion, existeRecurso: async (tipo, id) => Boolean(await prisma[tipo].findUnique({ where: { [`id_${tipo}`]: id } })) });
  await new Promise((r) => httpServer.listen(0, '127.0.0.1', r));
  const socket = conectarSocket(`http://127.0.0.1:${httpServer.address().port}`, { transports: ['websocket'], reconnection: false,
    extraHeaders: { Cookie: `${SESSION_COOKIE_NAME}=test-session` } });
  t.after(() => socket.disconnect());
  await once(socket, 'connect');
  await socket.emitWithAck('predio:suscribir', { id_predio: 8 });
  await socket.emitWithAck('sensor:suscribir', { id_sensor: 31 });
  const recibidas = []; socket.on('lectura:nueva', (l) => recibidas.push(l));
  const notifier = new SocketIoRealtimeNotifier(io);
  const crearBackend = () => {
    const useCase = new EvaluarLecturaUseCase({ repository: new PrismaDeteccionRepository(prisma), notifier });
    return startMqttSubscriber({ notifier, dependencies: () => ({ useCase, handleMessage: createMqttMessageHandler((l) => useCase.execute(l)) }),
      createClient: () => connectMqttClient({ NODE_ENV: 'test', MQTT_BROKER_URL: brokerUrl, MQTT_CLIENT_ID: 'backend', MQTT_USERNAME: 'backend', MQTT_PASSWORD: credenciales.backend }) });
  };
  let backend = crearBackend();
  t.after(async () => { await backend.endAsync(true); });
  await once(backend, 'lecturas:subscribed');
  const publisher = await mqtt.connectAsync(brokerUrl, { username: 'predio-8', password: credenciales.predios['8'], protocolVersion: 5, reconnectPeriod: 0, clientId: 'publisher-test' });
  t.after(async () => { await publisher.endAsync(true); });
  const mensaje = JSON.stringify({ valor: 20, fecha_hora: new Date(Date.now() - 1000).toISOString() });
  await publisher.publishAsync('incendios/8/31', mensaje, { qos: 1 });
  await esperar(() => recibidas.length === 1);
  assert.equal(recibidas[0].estado_lectura, 'VALIDA'); assert.ok(recibidas[0].id_lectura);
  await publisher.publishAsync('incendios/8/31', mensaje, { qos: 1 });
  await assert.rejects(publisher.publishAsync('incendios/12/51', mensaje, { qos: 1 }), /authoriz/i);
  await assert.rejects(publisher.publishAsync('incendios/8/999', mensaje, { qos: 1 }), /authoriz/i);
  await publisher.subscribeAsync('incendios/#');
  let filtradas = 0; publisher.on('message', () => filtradas++);
  await backend.endAsync();
  const offline = JSON.stringify({ valor: 20, fecha_hora: new Date().toISOString() });
  await publisher.publishAsync('incendios/8/31', offline, { qos: 1 });
  backend = crearBackend();
  await once(backend, 'lecturas:subscribed');
  await esperar(() => recibidas.length === 2);
  assert.equal(await prisma.lectura.count(), 2); assert.equal(filtradas, 0, 'Publisher no debe leer lecturas');
  assert.equal(new Set(recibidas.map((l) => l.id_lectura)).size, recibidas.length);

  await publisher.endAsync(); // La identidad del broker permite un solo gateway por predio.

  if (!process.env.PYTHON_BIN) throw new Error('Definir PYTHON_BIN para verificar los simuladores originales');
  const script = fileURLToPath(new URL('../../../docs/mqtt example/SENSORES/main.py', import.meta.url));
  // Tambien permite Python embebido (p. ej. pgAdmin), que ignora PYTHONPATH por defecto.
  const launcher = "import os,runpy,sys; sys.path[:0]=[os.path.dirname(sys.argv[1]), *filter(None,os.getenv('PYTHONPATH','').split(os.pathsep))]; sys.argv=sys.argv[1:]; runpy.run_path(sys.argv[0],run_name='__main__')";
  const python = spawn(process.env.PYTHON_BIN, ['-c', launcher, script, '--manifiesto', fileURLToPath(new URL('../../../docs/mqtt example/SENSORES/simuladores.json', import.meta.url)), '--broker', brokerUrl, '--credenciales', join(carpeta, 'publishers.json'), '--intervalo', '5', '--duracion', '6'],
    { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let salidaPython = ''; python.stdout.on('data', (x) => { salidaPython += x; }); python.stderr.on('data', (x) => { salidaPython += x; });
  t.after(() => python.kill());
  const [code] = await once(python, 'exit'); assert.equal(code, 0, salidaPython);
  await esperar(async () => await prisma.lectura.count() >= 20);
  assert.equal(await prisma.lectura.count({ where: { tipo_variable: 'CO2' } }), 4);
  assert.equal(await prisma.lectura.count({ where: { tipo_variable: 'GAS_LEL' } }), 4);
  assert.equal(await prisma.alerta.count({ where: { estado: 'CONFIRMADA' } }), 0);
  assert.equal(new Set(recibidas.map((l) => l.id_lectura)).size, recibidas.length);
});
