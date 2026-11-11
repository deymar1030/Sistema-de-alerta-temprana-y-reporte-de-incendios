import { Router } from "express";
import { InformeAtencionDependencies } from "./dependencies.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { requireCategoriaInstitucion } from "../../middlewares/requireCategoriaInstitucion.middleware.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";
import { CATEGORIAS_CIERRE_INCENDIO } from "../../../domain/institucion/categoriasInstitucion.js";

export class InformeAtencionRouter {
  static get routes() {
    const router = Router();

    const informeAtencionController = InformeAtencionDependencies.createController();
    // Solo Bomberos (o similar) emite y completa el informe que certifica
    // que el incendio quedo controlado; ver categoriasInstitucion.js.
    const soloBomberos = [
      requireRole(RolNombres.JEFE_INSTITUCION, RolNombres.OPERATIVO),
      requireCategoriaInstitucion(...CATEGORIAS_CIERRE_INCENDIO),
    ];

    router.get("/", informeAtencionController.list);
    router.get("/:id", informeAtencionController.getById);
    router.post("/", ...soloBomberos, informeAtencionController.create);
    router.put("/:id", ...soloBomberos, informeAtencionController.update);

    return router;
  }
}
