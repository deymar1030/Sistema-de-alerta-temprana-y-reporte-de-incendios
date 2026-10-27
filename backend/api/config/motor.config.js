import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// La BD conserva su esquema. Pesos/escalas faltantes se configuran en archivo.
export function cargarConfiguracionMotor(ruta = process.env.MOTOR_CONFIG_PATH) {
  if (!ruta) return {};
  const config = JSON.parse(readFileSync(resolve(ruta), 'utf8'));
  if (!config || Array.isArray(config) || typeof config !== 'object') throw new Error('Configuracion de motor invalida');
  return config;
}
