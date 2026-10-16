import http from "node:http";

import "./api/config/bigintJson.js";
import { envs } from "./api/config/envs.js";
import { createApiApp } from "./api/server.js";
import { createWebsocketManager } from "./websocketManager/bootstrap.js";
import { NotifierRegistry } from "./websocketManager/notifierRegistry.js";
import { startMqttSubscriber } from "./mqtt/bootstrap.js";

const apiApp = createApiApp();
const httpServer = http.createServer(apiApp);

const { io, notifier } = createWebsocketManager(httpServer);
NotifierRegistry.set(notifier);
const mqttClient = startMqttSubscriber({ notifier });

httpServer.listen(envs.PORT, () => {
  console.log(`Server running on port ${envs.PORT}`);
  console.log(`Health check: http://localhost:${envs.PORT}/api/health`);
  console.log(`Swagger docs: http://localhost:${envs.PORT}/docs`);
});

let cerrando = false;
async function cerrar() {
  if (cerrando) return;
  cerrando = true;
  const limite = setTimeout(() => process.exit(1), 10000);
  limite.unref();
  await mqttClient.endAsync();
  await new Promise((resolve) => io.close(resolve));
  const { default: prisma } = await import('./api/infrastructure/prismaConfig/prismaClient.js');
  await prisma.$disconnect();
  clearTimeout(limite);
  process.exit(0);
}
process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
