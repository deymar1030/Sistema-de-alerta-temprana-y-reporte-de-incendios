import { Router } from "express";
import { AlertaDependencies } from "./dependencies.js";

export class AlertaRouter {
  static get routes() {
    const router = Router();

    const alertaController = AlertaDependencies.createController();

    router.get("/activas", alertaController.activas);
    router.get("/", alertaController.list);
    router.get("/:id", alertaController.getById);
    router.patch("/:id/instituciones/:id_institucion/recibir", alertaController.recibir);
    router.patch("/:id/instituciones/:id_institucion/atender", alertaController.atender);
    router.patch("/:id/instituciones/:id_institucion/cerrar", alertaController.cerrar);

    return router;
  }
}
