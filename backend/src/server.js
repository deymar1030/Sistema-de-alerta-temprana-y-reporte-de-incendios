import express from "express";
import cors from "cors";
import morgan from "morgan";

import { envs } from "./config/envs.js";
import { AppRouter } from "./interfaces/router.js";

export default class Server {
  constructor(options = {}) {
    const { port = 3000 } = options;
    this.port = envs.PORT || port;
    this.app = express();

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(morgan("dev"));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  routes() {
    this.app.use("/api", AppRouter.routes);

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
    });
  }
}
