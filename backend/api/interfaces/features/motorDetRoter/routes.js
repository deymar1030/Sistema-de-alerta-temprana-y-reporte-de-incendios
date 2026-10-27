import { Router } from "express";
import { MotorDetDependencies } from "./dependencies.js";

export class MotorDetRouter {
  static get routes() {
    const router = Router();

    const motorDetController = MotorDetDependencies.createController();

    router.get("/", motorDetController.list);
    router.get("/:id", motorDetController.getById);

    return router;
  }
}
