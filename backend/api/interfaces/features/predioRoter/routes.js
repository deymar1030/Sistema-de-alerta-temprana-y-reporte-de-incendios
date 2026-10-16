import { Router } from "express";
import { PredioDependencies } from "./dependencies.js";

export class PredioRouter {
  static get routes() {
    const router = Router();

    const predioController = PredioDependencies.createController();

    router.get("/mapa", predioController.mapa);
    router.get("/", predioController.list);
    router.get("/:id", predioController.getById);
    router.post("/", predioController.create);
    router.put("/:id", predioController.update);
    router.delete("/:id", predioController.remove);

    return router;
  }
}
