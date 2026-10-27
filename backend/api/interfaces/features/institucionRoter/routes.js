import { Router } from "express";
import { InstitucionDependencies } from "./dependencies.js";

export class InstitucionRouter {
  static get routes() {
    const router = Router();

    const institucionController = InstitucionDependencies.createController();

    router.get("/", institucionController.list);
    router.get("/:id", institucionController.getById);
    router.post("/", institucionController.create);
    router.put("/:id", institucionController.update);
    router.delete("/:id", institucionController.remove);

    router.get("/:id/jurisdicciones", institucionController.listJurisdicciones);
    router.post("/:id/jurisdicciones", institucionController.addJurisdiccion);
    router.delete("/:id/jurisdicciones/:id_zona", institucionController.removeJurisdiccion);

    return router;
  }
}
