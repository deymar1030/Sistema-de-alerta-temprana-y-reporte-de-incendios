// Decide el estado/clasificacion de una alerta a partir del puntaje R y
// los umbrales del motor_det asignado al predio -- PDF del motor de
// deteccion, Tabla 10.
// Pendiente de implementar, ver nota en filtroHampel.js.
//
// @param {number} puntaje - R, 0 a 1
// @param {{ umbral_confirmacion: number, umbral_descarte: number }} motor
// @returns {"CONFIRMADA"|"DESCARTADA"|"EN_EVALUACION"}
export function clasificarAlerta(puntaje, motor) {
  throw new Error(
    "clasificarAlerta: pendiente de implementar (ver PDF del motor de deteccion, Tabla 10)"
  );
}
