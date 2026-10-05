import { createSocketServer } from "./server.js";
import { createSocketAuth } from "./auth.js";
import { registerConnectionManager } from "./connectionManager.js";
import { SocketIoRealtimeNotifier } from "./notifier.js";
import { AuthDependencies } from "../api/interfaces/features/authRoter/dependencies.js";

export function createWebsocketManager(httpServer) {
  const io = createSocketServer(httpServer);

  io.use(createSocketAuth(AuthDependencies.createValidateSesion()));
  registerConnectionManager(io);

  const notifier = new SocketIoRealtimeNotifier(io);

  return { io, notifier };
}
