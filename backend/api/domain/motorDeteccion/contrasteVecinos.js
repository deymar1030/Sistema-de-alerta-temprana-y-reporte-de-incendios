const FACTOR_MAD = 0.6745;

function mediana(valores) {
  const ordenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 1) return ordenados[medio];
  return (ordenados[medio - 1] + ordenados[medio]) / 2;
}

export function contrasteVecinos(valorActual, valoresVecinos, madMin) {
  const grupo = [valorActual, ...valoresVecinos];

  if (grupo.length < 3) {
    return { zrob: null, calculable: false };
  }

  const centro = mediana(grupo);
  const desviaciones = grupo.map((valor) => Math.abs(valor - centro));
  const mad = mediana(desviaciones);

  const zrob = (FACTOR_MAD * (valorActual - centro)) / Math.max(mad, madMin);

  return { zrob, calculable: true };
}
