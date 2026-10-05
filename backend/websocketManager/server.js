import { Server } from "socket.io";
import { envs } from "../api/config/envs.js";

// Crea el servidor de Socket.IO sobre el mismo httpServer que usa Express
// (lo recibe de app.js, no crea uno propio -- docs/GuiaTiempoReal.md §4).
export function createSocketServer(httpServer) {
  return new Server(httpServer, {
    cors: { origin: envs.CORS_ORIGINS, credentials: true },
  });
}
