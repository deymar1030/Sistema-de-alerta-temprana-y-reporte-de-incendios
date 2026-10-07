import { Router } from "express";
import { LecturaDependencies } from "./dependencies.js";

export class LecturaRouter {
  static get routes() {
    const router = Router();

    const lecturaController = LecturaDependencies.createController();

    router.get("/", lecturaController.list);
    router.get("/:id", lecturaController.getById);

    return router;
  }
}
