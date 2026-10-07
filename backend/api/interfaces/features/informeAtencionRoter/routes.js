import { Router } from "express";
import { InformeAtencionDependencies } from "./dependencies.js";

export class InformeAtencionRouter {
  static get routes() {
    const router = Router();

    const informeAtencionController = InformeAtencionDependencies.createController();

    router.get("/", informeAtencionController.list);
    router.get("/:id", informeAtencionController.getById);
    router.post("/", informeAtencionController.create);
    router.put("/:id", informeAtencionController.update);

    return router;
  }
}
