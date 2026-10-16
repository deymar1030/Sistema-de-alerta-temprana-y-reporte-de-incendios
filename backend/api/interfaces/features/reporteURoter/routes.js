import { Router } from "express";
import { ReporteUDependencies } from "./dependencies.js";

export class ReporteURouter {
  static get routes() {
    const router = Router();

    const reporteUController = ReporteUDependencies.createController();

    router.get("/", reporteUController.list);
    router.get("/:id", reporteUController.getById);
    router.post("/", reporteUController.create);
    router.patch("/:id/estado", reporteUController.updateEstado);
    router.patch("/:id/vincular-alerta", reporteUController.vincularAlerta);

    return router;
  }
}
