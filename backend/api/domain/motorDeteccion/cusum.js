// CUSUM (suma acumulada de desviaciones) para detectar un cambio
// sostenido de nivel -- PDF del motor de deteccion, ecuacion 3.
// Pendiente de implementar, ver nota en filtroHampel.js.
//
// @param {number[]} ventana
// @param {number} valorActual
// @param {number} h - umbral cusum_h del motor_det asignado
// @returns {{ disparado: boolean, acumulado: number }}
export function cusum(ventana, valorActual, h) {
  throw new Error(
    "cusum: pendiente de implementar (ver PDF del motor de deteccion, ecuacion 3)"
  );
}
