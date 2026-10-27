import { Router } from "express";
import { SensorDependencies } from "./dependencies.js";

export class SensorRouter {
  static get routes() {
    const router = Router();

    const sensorController = SensorDependencies.createController();

    router.get("/", sensorController.list);
    router.get("/:id", sensorController.getById);
    router.get("/:id/lecturas", sensorController.listLecturas);
    router.post("/", sensorController.create);
    router.put("/:id", sensorController.update);
    router.delete("/:id", sensorController.remove);

    return router;
  }
}
