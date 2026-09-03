import { Router } from "express";

export class AppRouter {
  static get routes() {
    const router = Router();

    router.get("/health", (req, res) => {
      res.json({ status: "ok", uptime: process.uptime() });
    });

    // Las rutas de módulos (reportes, alertas, usuarios, ...) se montan aquí.

    return router;
  }
}
