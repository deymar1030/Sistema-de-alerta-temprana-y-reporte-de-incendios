import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { envs } from "./config/envs.js";
import { AppRouter } from "./interfaces/router.js";
import { setupSwagger } from "./interfaces/docs/swagger.setup.js";
import { MqttAuthRouter } from "./interfaces/internal/mqttAuth/routes.js";

export function createApiApp() {
  const app = express();

  if (envs.TRUST_PROXY !== null) app.set("trust proxy", envs.TRUST_PROXY);

  app.use(cors({ origin: envs.CORS_ORIGINS, credentials: true }));
  app.use(cookieParser());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", AppRouter.routes);
  app.use("/internal/mqtt", MqttAuthRouter.routes);
  setupSwagger(app);

  app.get("/", (req, res) => {
    res.json({
      name: "Sistema de alerta temprana y reporte de incendios - API",
      status: "running",
    });
  });

  return app;
}
