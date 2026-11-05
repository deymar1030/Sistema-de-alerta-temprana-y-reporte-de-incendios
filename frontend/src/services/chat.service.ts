import { apiFetch } from './http'

// Contrato del backend: ver backend/api/interfaces/features/chatRoter.
// El servidor siempre resuelve el canal CATEGORIA a partir de la institucion
// del usuario autenticado (nunca se le pasa la categoria desde aca).
export type TipoCanalChat = 'GLOBAL' | 'CATEGORIA'

export interface MensajeChat {
  id_mensaje: string
  tipo_canal: TipoCanalChat
  categoria: string | null
  id_usuario: string
  id_institucion_emisor: string
  contenido: string
  tipo_mensaje: 'USUARIO' | 'SISTEMA'
  fecha_hora: string
  usuario_nombre: string | null
  institucion_nombre: string | null
}

function asArray(value: unknown, label: string): MensajeChat[] {
  if (!Array.isArray(value)) {
    throw new Error(`El backend no devolvió una lista de ${label}.`)
  }
  return value as MensajeChat[]
}

export const chatService = {
  async getGlobal(opts: { antes?: string; limite?: number } = {}): Promise<MensajeChat[]> {
    const params = new URLSearchParams()
    if (opts.antes) params.set('antes', opts.antes)
    if (opts.limite) params.set('limite', String(opts.limite))
    const query = params.toString() ? `?${params}` : ''
    return asArray(await apiFetch<unknown>(`/chat/global${query}`), 'chat global')
  },

  async getCategoria(opts: { antes?: string; limite?: number } = {}): Promise<MensajeChat[]> {
    const params = new URLSearchParams()
    if (opts.antes) params.set('antes', opts.antes)
    if (opts.limite) params.set('limite', String(opts.limite))
    const query = params.toString() ? `?${params}` : ''
    return asArray(await apiFetch<unknown>(`/chat/categoria${query}`), 'chat de categoría')
  },

  async enviar(tipo_canal: TipoCanalChat, contenido: string): Promise<MensajeChat> {
    return await apiFetch<MensajeChat>('/chat/mensajes', {
      method: 'POST',
      body: JSON.stringify({ tipo_canal, contenido }),
    })
  },
}
