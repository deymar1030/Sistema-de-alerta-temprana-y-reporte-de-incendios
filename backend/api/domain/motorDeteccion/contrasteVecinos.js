import { numeros, numeroFinito, positivo, mediana } from './estadistica.js';

export function contrasteVecinos(valorActual, valoresVecinos, madMin) {
  numeros(valoresVecinos, 'valoresVecinos');
  numeroFinito(valorActual, 'valorActual');
  positivo(madMin, 'madMin');
  const grupo = [valorActual, ...valoresVecinos];
  if (grupo.length < 3) return { zrob: null, calculable: false };
  const centro = mediana(grupo);
  const mad = mediana(grupo.map((v) => Math.abs(v - centro)));
  return { zrob: 0.6745 * (valorActual - centro) / Math.max(mad, madMin), calculable: true };
}
