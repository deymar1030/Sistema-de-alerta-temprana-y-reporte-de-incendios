import { Server } from "socket.io";
import { envs } from "../api/config/envs.js";

export function createSocketServer(httpServer) {
  return new Server(httpServer, {
    cors: { origin: envs.CORS_ORIGINS, credentials: true },
  });
}
