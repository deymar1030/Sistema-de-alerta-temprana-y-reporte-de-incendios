import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';

export const manifestDefault = fileURLToPath(new URL('../../docs/mqtt example/SENSORES/simuladores.json', import.meta.url));
export function leerSimuladores(path = manifestDefault) {
  const predios = JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
  if (!Array.isArray(predios) || !predios.length) throw new Error('Se requiere al menos un predio');
  const ids = new Set(), sensores = new Set();
  for (const p of predios) {
    if (!Number.isSafeInteger(p.id_predio) || p.id_predio < 1 || ids.has(p.id_predio)) throw new Error('ID de predio invalido o repetido');
    ids.add(p.id_predio);
    if (!Array.isArray(p.sensores) || !p.sensores.length) throw new Error('Predio sin sensores');
    for (const s of p.sensores) {
      if (!Number.isSafeInteger(s.id_sensor) || s.id_sensor < 1 || sensores.has(s.id_sensor)) throw new Error('ID de sensor invalido o repetido');
      sensores.add(s.id_sensor);
    }
  }
  return predios;
}

// Formato nativo $7$ de Mosquitto 2: PBKDF2-HMAC-SHA512, salt de 12 bytes.
export function hashMosquitto(password) {
  const salt = randomBytes(12), iterations = 120000;
  const hash = pbkdf2Sync(password, salt, iterations, 64, 'sha512');
  return `$7$${iterations}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function provisionar({ manifest = manifestDefault, output = fileURLToPath(new URL('../mqtt/runtime', import.meta.url)), brokerUrl = 'mqtt://127.0.0.1:1883' } = {}) {
  const predios = leerSimuladores(manifest);
  const broker = new URL(brokerUrl);
  if (!['mqtt:', 'mqtts:'].includes(broker.protocol) || broker.username || broker.password || /[\r\n]/.test(brokerUrl)) throw new Error('URL del broker invalida');
  mkdirSync(output, { recursive: true });
  const privateFile = join(output, 'credentials.private.json');
  const credenciales = existsSync(privateFile) ? JSON.parse(readFileSync(privateFile, 'utf8')) : { backend: randomBytes(24).toString('base64url'), predios: {} };
  const publishers = {};
  const passwd = [`backend:${hashMosquitto(credenciales.backend)}`];
  const acl = ['user backend', 'topic read incendios/+/+', ''];
  for (const p of predios) {
    const user = `predio-${p.id_predio}`;
    const password = credenciales.predios[p.id_predio] ??= randomBytes(24).toString('base64url');
    passwd.push(`${user}:${hashMosquitto(password)}`);
    publishers[p.id_predio] = { username: user, password };
    acl.push(`user ${user}`, ...p.sensores.map((s) => `topic write incendios/${p.id_predio}/${s.id_sensor}`), '');
  }
  const escribir = (name, content, mode = 0o600) => writeFileSync(join(output, name), content, { mode });
  escribir('credentials.private.json', JSON.stringify(credenciales, null, 2));
  escribir('publishers.json', JSON.stringify(publishers, null, 2));
  escribir('passwd', passwd.join('\n') + '\n', 0o644);
  escribir('acl', acl.join('\n'), 0o644);
  escribir('backend.env', `MQTT_BROKER_URL=${brokerUrl}\nMQTT_CLIENT_ID=backend\nMQTT_USERNAME=backend\nMQTT_PASSWORD=${credenciales.backend}\n`);
  return { output, predios: predios.length, sensores: predios.reduce((n, p) => n + p.sensores.length, 0) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const resultado = provisionar({ manifest: process.argv[2] || manifestDefault, brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://127.0.0.1:1883' });
  console.log(`Credenciales y ACL preparados para ${resultado.predios} predios / ${resultado.sensores} sensores en ${resultado.output}. No se modifico la BD.`);
}
