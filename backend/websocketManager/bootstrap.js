import { createSocketServer } from "./server.js";
import { createSocketAuth } from "./auth.js";
import { registerConnectionManager } from "./connectionManager.js";
import { SocketIoRealtimeNotifier } from "./notifier.js";
import { AuthDependencies } from "../api/interfaces/features/authRoter/dependencies.js";
import prisma from '../api/infrastructure/prismaConfig/prismaClient.js';

export function createWebsocketManager(httpServer) {
  const io = createSocketServer(httpServer);

  const validateSesion = AuthDependencies.createValidateSesion();
  io.use(createSocketAuth(validateSesion));
  registerConnectionManager(io, { validateSesion, existeRecurso: async (tipo, id) => {
    const recurso = await prisma[tipo].findUnique({ where: { [`id_${tipo}`]: id }, select: { [`id_${tipo}`]: true } });
    return Boolean(recurso);
  } });

  const notifier = new SocketIoRealtimeNotifier(io);

  return { io, notifier };
}
