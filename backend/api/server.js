import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { envs } from "./config/envs.js";
import { AppRouter } from "./interfaces/router.js";
import { setupSwagger } from "./interfaces/docs/swagger.setup.js";

// Solo construye el app de Express (middlewares + rutas); no escucha el
// puerto. Quien levanta el servidor es app.js, con http.createServer(app),
// para poder compartir ese mismo httpServer con Socket.IO
// (ver docs/GuiaTiempoReal.md §4).
export function createApiApp() {
  const app = express();

  if (envs.TRUST_PROXY !== null) app.set("trust proxy", envs.TRUST_PROXY);

  // credentials: true permite que el navegador envie la cookie de sesion;
  // por eso el origen debe ser explicito (no "*").
  app.use(cors({ origin: envs.CORS_ORIGINS, credentials: true }));
  app.use(cookieParser());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", AppRouter.routes);
  setupSwagger(app);

  app.get("/", (req, res) => {
    res.json({
      name: "Sistema de alerta temprana y reporte de incendios - API",
      status: "running",
    });
  });

  return app;
}
