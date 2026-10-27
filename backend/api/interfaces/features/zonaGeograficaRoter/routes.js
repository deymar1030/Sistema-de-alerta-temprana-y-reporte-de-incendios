import { Router } from "express";
import { ZonaGeograficaDependencies } from "./dependencies.js";

export class ZonaGeograficaRouter {
  static get routes() {
    const router = Router();

    const zonaGeograficaController = ZonaGeograficaDependencies.createController();

    router.get("/", zonaGeograficaController.list);
    router.get("/:id", zonaGeograficaController.getById);
    router.post("/", zonaGeograficaController.create);
    router.put("/:id", zonaGeograficaController.update);
    router.delete("/:id", zonaGeograficaController.remove);

    return router;
  }
}
