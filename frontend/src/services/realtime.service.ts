import { io, type Socket } from 'socket.io-client'

// El servidor autentica el socket con la misma cookie de sesión HttpOnly
// (ver backend/websocketManager/auth.js) y lo suscribe solo a sus rooms
// (usuario:<id>, institucion:<id>): no hace falta mandar credenciales ni
// unirse a nada a mano para recibir alertas/notificaciones propias.
let socket: Socket | null = null

// El socket vive en el mismo host que la API. Si VITE_API_URL apunta a otro
// dominio (producción), se conecta ahí; si es relativa ('/api', desarrollo con
// el proxy de Vite), se queda en el origen de la página.
function origenRealtime(): string {
  const apiBase = import.meta.env.VITE_API_URL ?? '/api'
  return new URL(apiBase, window.location.origin).origin
}

export function connectRealtime(): Socket {
  if (socket) return socket

  socket = io(origenRealtime(), {
    path: '/socket.io',
    withCredentials: true,
    transports: ['websocket', 'polling'],
  })

  return socket
}

export function disconnectRealtime(): void {
  socket?.disconnect()
  socket = null
}

export function getRealtimeSocket(): Socket | null {
  return socket
}
