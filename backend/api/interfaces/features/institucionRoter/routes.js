import { Router } from "express";
import { InstitucionDependencies } from "./dependencies.js";
import { requireRole } from "../../middlewares/requireRole.middleware.js";
import { RolNombres } from "../../../domain/rol/rolNombres.js";

export class InstitucionRouter {
  static get routes() {
    const router = Router();

    const institucionController = InstitucionDependencies.createController();

    router.get("/", institucionController.list);
    router.get("/:id", institucionController.getById);
    router.post("/", institucionController.create);
    router.put("/:id", institucionController.update);
    router.patch(
      "/:id/disponibilidad",
      requireRole(RolNombres.JEFE_INSTITUCION),
      institucionController.updateDisponibilidad
    );
    router.delete("/:id", institucionController.remove);


    return router;
  }
}
