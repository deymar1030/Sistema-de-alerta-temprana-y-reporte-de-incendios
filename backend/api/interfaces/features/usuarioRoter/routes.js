import { Router } from "express";
import { UsuarioDependencies } from "./dependencies.js";

export class UsuarioRouter {
  static get routes() {
    const router = Router();

    const usuarioController = UsuarioDependencies.createController();

    router.get("/", usuarioController.list);
    router.get("/:id", usuarioController.getById);
    router.post("/", usuarioController.create);
    router.put("/:id", usuarioController.update);
    router.delete("/:id", usuarioController.remove);

    return router;
  }
}
