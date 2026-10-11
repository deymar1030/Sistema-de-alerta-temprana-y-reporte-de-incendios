const FACTOR_MAD = 0.6745;

function mediana(valores) {
  const ordenados = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(ordenados.length / 2);
  if (ordenados.length % 2 === 1) return ordenados[medio];
  return (ordenados[medio - 1] + ordenados[medio]) / 2;
}

export function filtroHampel(ventana, valorActual, madMin, umbralZ) {
  if (!Array.isArray(ventana) || ventana.length === 0) {
    return { mediana: null, mad: null, z: null, esAnomala: false };
  }

  const centro = mediana(ventana);
  const desviaciones = ventana.map((valor) => Math.abs(valor - centro));
  const mad = mediana(desviaciones);

  const z = (FACTOR_MAD * (valorActual - centro)) / Math.max(mad, madMin);

  return { mediana: centro, mad, z, esAnomala: Math.abs(z) >= umbralZ };
}
