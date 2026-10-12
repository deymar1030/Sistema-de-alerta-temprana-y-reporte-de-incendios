import { Router } from "express";
import { FireDetectionRouter } from "./fire-detection.routes.js";

export class AppRouter {
  static get routes() {
    const router = Router();

    router.get("/health", (req, res) => {
      res.json({ status: "ok", uptime: process.uptime() });
    });

    router.use("/detections", FireDetectionRouter.routes);

    // Las rutas de módulos (reportes, alertas, usuarios, ...) se montan aquí.

    return router;
  }
}
