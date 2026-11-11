import { Router } from "express";
import { UsuarioDependencies } from "./dependencies.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";

export class UsuarioRouter {
  static get routes() {
    const router = Router();

    const usuarioController = UsuarioDependencies.createController();

    const soloAdminOJefe = requireRole(RolNombres.ADMIN, RolNombres.JEFE_INSTITUCION);

    router.get("/", soloAdminOJefe, usuarioController.list);
    // Antes de "/:id": "operativos" no debe interpretarse como un id.
    router.get("/operativos", requireRole(RolNombres.JEFE_INSTITUCION), usuarioController.listOperativos);
    // GET/PUT "/:id" sin requireRole aqui a proposito: cualquier rol puede
    // consultar/editar su PROPIA cuenta (autogestion de "Mi cuenta"), el
    // controller decide caso por caso (uno mismo, ADMIN, o JEFE_INSTITUCION
    // sobre su propio OPERATIVO).
    router.get("/:id", usuarioController.getById);
    router.post("/", soloAdminOJefe, usuarioController.create);
    router.put("/:id", usuarioController.update);
    router.patch("/:id/desactivar", soloAdminOJefe, usuarioController.desactivar);
    router.patch("/:id/reactivar", soloAdminOJefe, usuarioController.reactivar);

    return router;
  }
}
