import http from "node:http";

import "./api/config/bigintJson.js";
import { envs } from "./api/config/envs.js";
import { createApiApp } from "./api/server.js";

const apiApp = createApiApp();
const httpServer = http.createServer(apiApp);

httpServer.listen(envs.PORT, () => {
  console.log(`Server running on port ${envs.PORT}`);
  console.log(`Health check: http://localhost:${envs.PORT}/api/health`);
  console.log(`Swagger docs: http://localhost:${envs.PORT}/docs`);
});
