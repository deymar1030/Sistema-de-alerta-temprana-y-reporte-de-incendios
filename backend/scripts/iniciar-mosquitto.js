import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

export function configuracionLocal(runtime, puerto = 1883) {
  if (!Number.isInteger(puerto) || puerto < 1024 || puerto > 65535) throw new Error('Puerto MQTT local invalido');
  const path = (p) => resolve(p).replaceAll('\\', '/');
  return readFileSync(new URL('../mqtt/mosquitto.conf.example', import.meta.url), 'utf8')
    .replace('listener 1883', `listener ${puerto} 127.0.0.1`)
    .replace('/mosquitto/config/passwd', path(join(runtime, 'passwd')))
    .replace('/mosquitto/config/acl', path(join(runtime, 'acl')))
    .replace('/mosquitto/data/', `${path(join(runtime, 'data'))}/`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const runtime = fileURLToPath(new URL('../mqtt/runtime/', import.meta.url));
  for (const file of ['passwd', 'acl']) if (!existsSync(join(runtime, file))) throw new Error('Primero ejecutar npm run mqtt:provisionar');
  mkdirSync(join(runtime, 'data'), { recursive: true });
  const conf = join(runtime, 'mosquitto.local.conf');
  writeFileSync(conf, configuracionLocal(runtime, Number(process.env.MQTT_HOST_PORT || 1883)));
  const local = fileURLToPath(new URL('../.runtime/mosquitto-bin/mosquitto.exe', import.meta.url));
  const exe = process.env.MOSQUITTO_BIN || (existsSync(local) ? local : 'mosquitto');
  const broker = spawn(exe, ['-c', conf], { windowsHide: true, stdio: 'inherit' });
  broker.on('error', (e) => { console.error('No se pudo iniciar Mosquitto:', e.message); process.exitCode = 1; });
  broker.on('exit', (code) => { process.exitCode = code ?? 0; });
  process.on('SIGINT', () => broker.kill('SIGINT'));
  process.on('SIGTERM', () => broker.kill('SIGTERM'));
}
