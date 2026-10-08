import { Router } from "express";
import { UsuarioDependencies } from "./dependencies.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";

export class UsuarioRouter {
  static get routes() {
    const router = Router();

    const usuarioController = UsuarioDependencies.createController();

    router.get("/", usuarioController.list);
    // Antes de "/:id": "operativos" no debe interpretarse como un id.
    router.get("/operativos", requireRole(RolNombres.JEFE_INSTITUCION), usuarioController.listOperativos);
    router.get("/:id", usuarioController.getById);
    router.post("/", usuarioController.create);
    router.put("/:id", usuarioController.update);
    router.patch("/:id/desactivar", usuarioController.desactivar);
    router.patch("/:id/reactivar", usuarioController.reactivar);

    return router;
  }
}
