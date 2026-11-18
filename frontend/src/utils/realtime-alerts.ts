// Aplica un evento de alerta (socket) sobre la lista que ya esta en pantalla.
// Devuelve true si se resolvio en memoria; false si hace falta pedir la lista
// por HTTP (alerta nueva para esta vista o cambio de estado, que puede moverla
// de filtro o cambiar sus ubicaciones/envios).
const CAMPOS_EN_VIVO = ['puntaje', 'clasificacion', 'fecha_pico_critico', 'fecha_confirmacion', 'fecha_cierre', 'en_atencion', 'atendida_por'] as const

export function aplicarEventoAlerta<T extends { id_alerta: string | number; estado: string }>(lista: T[], payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false
  const evento = payload as Record<string, unknown>
  if (evento.id_alerta == null) return false
  const actual = lista.find(item => String(item.id_alerta) === String(evento.id_alerta))
  if (!actual || actual.estado !== evento.estado) return false
  const destino = actual as unknown as Record<string, unknown>
  for (const campo of CAMPOS_EN_VIVO) {
    if (campo in evento) destino[campo] = evento[campo]
  }
  return true
}

export function payloadDeEvento(event: Event): unknown {
  return (event as CustomEvent<{ payload?: unknown }>).detail?.payload
}
