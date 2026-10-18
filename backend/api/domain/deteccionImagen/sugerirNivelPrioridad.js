// Umbral propio del dominio para escalar a ALTA -- separado del threshold
// que ya trae el modelo (model_config.threshold), que solo decide FIRE/NO_FIRE.
const UMBRAL_ALTA = 0.85;

const RANGO_PRIORIDAD = { ALTA: 3, MEDIA: 2, BAJA: 1 };

export function sugerirNivelPrioridad(prediccion) {
  if (!prediccion || !prediccion.detected) return null;

  if (typeof prediccion.fire_probability === "number" && prediccion.fire_probability >= UMBRAL_ALTA) {
    return "ALTA";
  }

  return "MEDIA";
}

// Nunca degrada: si el ciudadano ya marco ALTA, una sugerencia MEDIA no la baja.
export function combinarNivelPrioridad(nivelActual, nivelSugerido) {
  if (!nivelSugerido) return nivelActual ?? null;

  const rangoActual = nivelActual ? RANGO_PRIORIDAD[nivelActual] ?? 0 : 0;
  const rangoSugerido = RANGO_PRIORIDAD[nivelSugerido] ?? 0;

  return rangoSugerido > rangoActual ? nivelSugerido : nivelActual;
}

export function describirPrediccion(prediccion) {
  if (!prediccion) return null;

  const porcentaje = Math.round((prediccion.fire_probability ?? 0) * 100);
  const etiqueta = prediccion.detected ? "posible incendio detectado" : "sin incendio detectado";
  const aviso = prediccion.warning ? " (confianza baja, requiere revision humana)" : "";

  return `Analisis IA: ${etiqueta} (${porcentaje}%)${aviso}`;
}
