import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { envs } from "./config/envs.js";
import { AppRouter } from "./interfaces/router.js";
import { setupSwagger } from "./interfaces/docs/swagger.setup.js";

export default class Server {
  constructor(options = {}) {
    const { port = 3000 } = options;
    this.port = envs.PORT || port;
    this.app = express();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    if (envs.TRUST_PROXY !== null) this.app.set("trust proxy", envs.TRUST_PROXY);

    // credentials: true permite que el navegador envie la cookie de sesion;
    // por eso el origen debe ser explicito (no "*").
    this.app.use(cors({ origin: envs.CORS_ORIGINS, credentials: true }));
    this.app.use(cookieParser());
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    this.app.use("/api", AppRouter.routes);
    setupSwagger(this.app);

    this.app.get("/", (req, res) => {
      res.json({
        name: "Sistema de alerta temprana y reporte de incendios - API",
        status: "running",
      });
    });
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Server running on port ${this.port}`);
      console.log(`Health check: http://localhost:${this.port}/api/health`);
      console.log(`Swagger docs: http://localhost:${this.port}/docs`);
    });
  }
}
