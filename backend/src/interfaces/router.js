import { Router } from "express";
import SensorRouter from "./features/sensor/routes.js";
import { ZonaGeograficaRouter } from "./features/zonaGeograficaRoter/routes.js";
import { InstitucionRouter } from "./features/institucionRoter/routes.js";

export class AppRouter {
  static get routes() {
    const router = Router();

    router.get("/health", (req, res) => {
      res.json({
        status: "ok",
        uptime: process.uptime(),
      });
    });

    router.use("/zonas-geograficas", ZonaGeograficaRouter.routes);
    router.use("/sensores", SensorRouter);
    router.use("/instituciones", InstitucionRouter.routes);

    return router;
  }
}