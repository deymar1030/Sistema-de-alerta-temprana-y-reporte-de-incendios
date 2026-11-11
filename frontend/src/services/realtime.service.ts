import { io, type Socket } from 'socket.io-client'

// El servidor autentica el socket con la misma cookie de sesión HttpOnly
// (ver backend/websocketManager/auth.js) y lo suscribe solo a sus rooms
// (usuario:<id>, institucion:<id>): no hace falta mandar credenciales ni
// unirse a nada a mano para recibir alertas/notificaciones propias.
let socket: Socket | null = null

export function connectRealtime(): Socket {
  if (socket) return socket

  socket = io('/', {
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
