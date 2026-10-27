import { Router } from "express";
import { NotificacionDependencies } from "./dependencies.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";

export class NotificacionRouter {
  static get routes() {
    const router = Router();

    const notificacionController = NotificacionDependencies.createController();

    router.get("/", notificacionController.list);
    router.get("/no-leidas/conteo", notificacionController.conteoNoLeidas);
    router.patch("/leer-todas", notificacionController.marcarTodasLeidas);
    router.patch("/:id/leer", notificacionController.marcarLeida);
    router.post(
      "/asignaciones",
      requireRole(RolNombres.JEFE_INSTITUCION),
      notificacionController.asignarAlerta
    );

    return router;
  }
}
