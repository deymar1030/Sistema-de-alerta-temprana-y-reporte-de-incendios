import { Router } from "express";
import rateLimit from "express-rate-limit";
import { mqttAuthGuard } from "../../middlewares/mqttAuthGuard.middleware.js";
import { MqttAuthDependencies } from "./dependencies.js";

const limitador = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

export class MqttAuthRouter {
  static get routes() {
    const router = Router();
    const controller = MqttAuthDependencies.createController();

    router.use(mqttAuthGuard, limitador);
    router.post("/auth", controller.auth);
    router.post("/acl", controller.acl);

    return router;
  }
}
