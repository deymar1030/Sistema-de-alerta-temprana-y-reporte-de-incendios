import { createSocketServer } from "./server.js";
import { createSocketAuth } from "./auth.js";
import { registerConnectionManager } from "./connectionManager.js";
import { SocketIoRealtimeNotifier } from "./notifier.js";
import { AuthDependencies } from "../api/interfaces/features/authRoter/dependencies.js";

// Arma el servidor de WebSockets completo (server + auth + rooms +
// connectionManager) y devuelve { io, notifier } para que app.js se lo
// pase tanto a api/ como a mqtt/ (docs/GuiaTiempoReal.md §3-4).
export function createWebsocketManager(httpServer) {
  const io = createSocketServer(httpServer);

  io.use(createSocketAuth(AuthDependencies.createValidateSesion()));
  registerConnectionManager(io);

  const notifier = new SocketIoRealtimeNotifier(io);

  return { io, notifier };
}
