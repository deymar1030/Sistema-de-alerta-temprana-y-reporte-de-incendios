import { numeros, positivo } from './estadistica.js';

// Ventana reconstruida de hasta 20 z ordenados; no mantiene estado en memoria.
export function cusum(zRecientes, cusumH, k = 0.5) {
  numeros(zRecientes, 'zRecientes');
  positivo(cusumH, 'cusumH');
  positivo(k, 'k');
  const acumulado = zRecientes.slice(-20).reduce((s, z) => Math.max(0, s + z - k), 0);
  return { acumulado, disparado: acumulado > cusumH };
}
