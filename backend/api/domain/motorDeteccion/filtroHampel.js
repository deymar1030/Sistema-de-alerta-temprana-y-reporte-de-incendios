// Filtro de Hampel (mediana/MAD, z-score) sobre la ventana de lecturas
// recientes de un sensor -- PDF del motor de deteccion, ecuaciones 1-2.
// Pendiente de implementar: por ahora es un placeholder para que
// evaluarLectura.useCase pueda importarlo sin romper, sin fabricar la
// formula exacta del PDF.
//
// @param {number[]} ventana - valores recientes del sensor (ventana_base_min)
// @param {number} valorActual
// @returns {{ esAnomalo: boolean, zScore: number }}
export function filtroHampel(ventana, valorActual) {
  throw new Error(
    "filtroHampel: pendiente de implementar (ver PDF del motor de deteccion, ecuaciones 1-2)"
  );
}
