import { onBeforeUnmount } from 'vue'
import { onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue'
import { socket } from '../services/realtime'

export const INSTITUTION_EVENTS = [
  'notificacion:nueva',
  'alerta:abierta',
  'alerta:actualizada',
  'alerta:confirmada',
  'alerta:descartada',
  'notificacion:envio-actualizado',
]

// Ejecuta `refresh` cuando llega alguno de los eventos de Socket.IO.
// - Reutiliza la conexión existente (services/realtime).
// - Los listeners se registran al entrar a la vista y se quitan al salir o destruirla,
//   sin duplicarse aunque la vista entre varias veces.
// - Si llegan varios eventos juntos se coalescen en una recarga extra como máximo.
export function useRealtimeRefresh(refresh: () => Promise<unknown> | void, events: string[] = INSTITUTION_EVENTS) {
  let running = false
  let pending = false
  let attached = false

  const run = async () => {
    if (running) {
      pending = true
      return
    }
    running = true
    try {
      do {
        pending = false
        await refresh()
      } while (pending)
    } catch (error) {
      console.error('Error al refrescar datos', error)
    } finally {
      running = false
    }
  }

  const listener = () => {
    void run()
  }

  const attach = () => {
    if (attached) return
    attached = true
    events.forEach((event) => {
      socket.off(event, listener)
      socket.on(event, listener)
    })
  }

  const detach = () => {
    if (!attached) return
    attached = false
    events.forEach((event) => socket.off(event, listener))
  }

  onIonViewDidEnter(attach)
  onIonViewDidLeave(detach)
  onBeforeUnmount(detach)

  return { refresh: run }
}
