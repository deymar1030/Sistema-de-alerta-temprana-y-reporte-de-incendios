// Combina z-score (Hampel), cusum, pendiente (Theil-Sen) y contraste de
// vecinos en el puntaje R del episodio (alerta.puntaje, 0 a 1) -- PDF del
// motor de deteccion, ecuaciones 6-7.
// Pendiente de implementar, ver nota en filtroHampel.js.
//
// @param {{ zScore: number, cusum: number, pendiente: number, zrob: number }} senales
// @returns {number} puntaje R entre 0 y 1
export function puntajeAlerta(senales) {
  throw new Error(
    "puntajeAlerta: pendiente de implementar (ver PDF del motor de deteccion, ecuaciones 6-7)"
  );
}
