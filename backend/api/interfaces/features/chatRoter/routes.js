import { Router } from "express";
import { ChatDependencies } from "./dependencies.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";

export class ChatRouter {
  static get routes() {
    const router = Router();

    const chatController = ChatDependencies.createController();
    // Coordinacion entre instituciones: jefes y operativos (quien esta en
    // camino, quien tiene personal disponible). Otros roles (CIUDADANO,
    // AUDITOR, ADMIN) no participan de este chat.
    const soloCoordinacion = requireRole(RolNombres.JEFE_INSTITUCION, RolNombres.OPERATIVO);

    router.get("/global", soloCoordinacion, chatController.listarGlobal);
    router.get("/categoria", soloCoordinacion, chatController.listarCategoria);
    router.post("/mensajes", soloCoordinacion, chatController.enviar);

    return router;
  }
}
