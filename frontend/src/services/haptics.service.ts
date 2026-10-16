export const hapticsService = {
  lightImpact: () => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(14)
      }
    } catch {
      // No hay soporte nativo en este entorno; se conserva la operación sin romper la UI.
    }
  },
}
