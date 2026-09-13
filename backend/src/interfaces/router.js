import { Router } from "express";
import { ZonaGeograficaRouter } from "./features/zonaGeograficaRoter/routes.js";

export class AppRouter {
  static get routes() {
    const router = Router();

    router.get("/health", (req, res) => {
      res.json({ status: "ok", uptime: process.uptime() });
    });

    router.use("/zonas-geograficas", ZonaGeograficaRouter.routes);

    return router;
  }
}
