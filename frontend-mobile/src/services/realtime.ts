import { io } from 'socket.io-client'

// Si usas variables de entorno, asegúrate de que apunte a tu URL HTTPS
const apiBase = import.meta.env.VITE_API_URL || 'https://alertaincendios.duckdns.org/api'
const origin = new URL(apiBase, window.location.origin).origin

export const socket = io(origin, {
  path: '/socket.io/',
  withCredentials: true,
  autoConnect: false, // Se conecta solo tras el login
})

export function connectRealtime() {
  socket.connect()
}

export function disconnectRealtime() {
  socket.disconnect()
}