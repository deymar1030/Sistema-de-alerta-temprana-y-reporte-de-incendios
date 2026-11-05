import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { chatService, type MensajeChat, type TipoCanalChat } from '../services/chat.service'

const LIMITE_PAGINA = 40
const POLL_MS = 8_000

interface CanalState {
  mensajes: MensajeChat[]
  loading: boolean
  loadingMore: boolean
  sending: boolean
  error: string
  hayMas: boolean
}

function nuevoCanal(): CanalState {
  return { mensajes: [], loading: false, loadingMore: false, sending: false, error: '', hayMas: true }
}

// Este frontend no usa Socket.IO en ningun lado (confirmado en
// SuperAdminAlertsView.vue: "Sin cliente Socket.IO en la version
// suministrada, sincronizacion periodica"), asi que el chat sigue la misma
// convencion: polling, no WebSocket.
export const useChatStore = defineStore('chat', () => {
  const canales = reactive<Record<TipoCanalChat, CanalState>>({
    GLOBAL: nuevoCanal(),
    CATEGORIA: nuevoCanal(),
  })
  let pollTimer: ReturnType<typeof setInterval> | null = null

  function mezclar(canal: CanalState, nuevos: MensajeChat[]) {
    // El backend devuelve mas reciente primero; se guarda ascendente para
    // renderizar directo de arriba a abajo como un chat normal.
    const vistos = new Set(canal.mensajes.map(m => m.id_mensaje))
    const agregar = nuevos.filter(m => !vistos.has(m.id_mensaje)).reverse()
    if (agregar.length) canal.mensajes = [...canal.mensajes, ...agregar]
  }

  async function cargar(tipo: TipoCanalChat) {
    const canal = canales[tipo]
    canal.loading = true
    canal.error = ''
    try {
      const fetcher = tipo === 'GLOBAL' ? chatService.getGlobal : chatService.getCategoria
      const pagina = await fetcher({ limite: LIMITE_PAGINA })
      canal.mensajes = [...pagina].reverse()
      canal.hayMas = pagina.length === LIMITE_PAGINA
    } catch (cause) {
      canal.error = cause instanceof Error ? cause.message : 'No se pudo cargar el chat.'
    } finally {
      canal.loading = false
    }
  }

  async function cargarMasAntiguos(tipo: TipoCanalChat) {
    const canal = canales[tipo]
    if (canal.loadingMore || !canal.hayMas || !canal.mensajes.length) return
    canal.loadingMore = true
    try {
      const fetcher = tipo === 'GLOBAL' ? chatService.getGlobal : chatService.getCategoria
      const antes = canal.mensajes[0]!.id_mensaje
      const pagina = await fetcher({ antes, limite: LIMITE_PAGINA })
      canal.mensajes = [...[...pagina].reverse(), ...canal.mensajes]
      canal.hayMas = pagina.length === LIMITE_PAGINA
    } catch (cause) {
      canal.error = cause instanceof Error ? cause.message : 'No se pudieron cargar mensajes anteriores.'
    } finally {
      canal.loadingMore = false
    }
  }

  async function refrescar(tipo: TipoCanalChat) {
    const canal = canales[tipo]
    try {
      const fetcher = tipo === 'GLOBAL' ? chatService.getGlobal : chatService.getCategoria
      const pagina = await fetcher({ limite: LIMITE_PAGINA })
      mezclar(canal, pagina)
    } catch {
      // El polling silencioso no debe tapar la pantalla con errores; el
      // error visible solo viene de la carga inicial o del envio.
    }
  }

  async function enviar(tipo: TipoCanalChat, contenido: string) {
    const texto = contenido.trim()
    if (!texto) return
    const canal = canales[tipo]
    canal.sending = true
    canal.error = ''
    try {
      const creado = await chatService.enviar(tipo, texto)
      if (!canal.mensajes.some(m => m.id_mensaje === creado.id_mensaje)) {
        canal.mensajes = [...canal.mensajes, creado]
      }
    } catch (cause) {
      canal.error = cause instanceof Error ? cause.message : 'No se pudo enviar el mensaje.'
      throw cause
    } finally {
      canal.sending = false
    }
  }

  function startPolling() {
    if (pollTimer) return
    pollTimer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void refrescar('GLOBAL')
      void refrescar('CATEGORIA')
    }, POLL_MS)
  }

  function stopPolling() {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
  }

  function clear() {
    canales.GLOBAL = nuevoCanal()
    canales.CATEGORIA = nuevoCanal()
    stopPolling()
  }

  return { canales, cargar, cargarMasAntiguos, enviar, startPolling, stopPolling, clear }
})
