import { distanciaMetros } from "../motorDeteccion/evaluarPredio.js";

// Varios ciudadanos pueden reportar el mismo incendio por separado: sin
// esto, cada reporte ALTA crea su propia alerta y se duplica. Si ya existe
// una alerta activa originada por OTRO reporte ciudadano dentro de este
// radio/ventana, se corrobora esa en vez de crear una nueva.
export const RADIO_CORROBORACION_M = 300;
export const VENTANA_CORROBORACION_MIN = 60;

// candidatos: [{ alerta, latitud, longitud, creada_en }] — alertas activas
// originadas por reporte_u, con las coordenadas de ese reporte y cuando se
// creo la alerta. nuevo: coordenadas/hora del reporte que se esta evaluando.
export function buscarAlertaCorroborable(candidatos, nuevo, {
  radioM = RADIO_CORROBORACION_M,
  ventanaMin = VENTANA_CORROBORACION_MIN,
} = {}) {
  if (nuevo.latitud == null || nuevo.longitud == null) return null;

  let mejor = null, mejorDistancia = Infinity;
  for (const candidato of candidatos) {
    if (candidato.latitud == null || candidato.longitud == null) continue;
    const minutos = Math.abs(+nuevo.ahora - +candidato.creada_en) / 60000;
    if (minutos > ventanaMin) continue;
    const distancia = distanciaMetros(candidato, nuevo);
    if (distancia > radioM) continue;
    if (distancia < mejorDistancia) { mejor = candidato; mejorDistancia = distancia; }
  }
  return mejor;
}

// Sube el puntaje con cada corroboracion (mas testigos, mas confianza), sin
// pasar de 0.99 -- nunca llega a la certeza absoluta de una confirmacion en
// terreno.
export function puntajeCorroborado(puntajeExistente, puntajeNuevo) {
  const base = Math.max(Number(puntajeExistente ?? 0), Number(puntajeNuevo ?? 0));
  return Math.min(0.99, Number((base + 0.05).toFixed(3)));
}
