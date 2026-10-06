import { Router } from "express";
import { AlertaDependencies } from "./dependencies.js";

export class AlertaRouter {
  static get routes() {
    const router = Router();

    const alertaController = AlertaDependencies.createController();

    // IMPORTANTE: /activas debe estar antes de /:id
    router.get("/", alertaController.list);
    router.get("/activas", alertaController.getActivas);
    router.get("/:id", alertaController.getById);

    router.patch(
      "/:id/instituciones/:id_institucion/recibir",
      alertaController.marcarRecibido
    );

    router.patch(
      "/:id/instituciones/:id_institucion/atender",
      alertaController.marcarAtendido
    );

    router.patch(
      "/:id/instituciones/:id_institucion/cerrar",
      alertaController.cerrar
    );

    return router;
  }
}