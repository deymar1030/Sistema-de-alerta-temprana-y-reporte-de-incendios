import { numeros, numeroFinito, positivo, mediana } from './estadistica.js';

export function filtroHampel(ventana, valorActual, madMin, umbralZ) {
  numeros(ventana, 'ventana');
  numeroFinito(valorActual, 'valorActual');
  positivo(madMin, 'madMin');
  positivo(umbralZ, 'umbralZ');
  if (!ventana.length) return { mediana: null, mad: null, z: null, esAnomala: false };
  const centro = mediana(ventana);
  const mad = mediana(ventana.map((valor) => Math.abs(valor - centro)));
  const z = 0.6745 * (valorActual - centro) / Math.max(mad, madMin);
  return { mediana: centro, mad, z, esAnomala: Math.abs(z) >= umbralZ };
}
