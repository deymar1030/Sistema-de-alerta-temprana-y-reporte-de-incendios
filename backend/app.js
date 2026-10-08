import http from "node:http";

import "./api/config/bigintJson.js";
import { envs } from "./api/config/envs.js";
import { createApiApp } from "./api/server.js";
import { createWebsocketManager } from "./websocketManager/bootstrap.js";
import { NotifierRegistry } from "./websocketManager/notifierRegistry.js";
import { startMqttSubscriber } from "./mqtt/bootstrap.js";

const apiApp = createApiApp();
const httpServer = http.createServer(apiApp);

const { notifier } = createWebsocketManager(httpServer);
NotifierRegistry.set(notifier);
startMqttSubscriber({ notifier });

httpServer.listen(envs.PORT, () => {
  console.log(`Server running on port ${envs.PORT}`);
  console.log(`Health check: http://localhost:${envs.PORT}/api/health`);
  console.log(`Swagger docs: http://localhost:${envs.PORT}/docs`);
});
