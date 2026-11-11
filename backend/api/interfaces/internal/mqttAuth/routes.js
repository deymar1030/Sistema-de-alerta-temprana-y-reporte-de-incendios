import { Router } from "express";
import { mqttAuthGuard } from "../../middlewares/mqttAuthGuard.middleware.js";
import { MqttAuthDependencies } from "./dependencies.js";

// Sin rate limit: estas rutas solo las llama el propio broker Mosquitto
// (mosquitto-go-auth) por cada auth/ACL de CADA cliente MQTT conectado, no
// trafico publico -- mqttAuthGuard (secreto compartido) ya es la barrera
// real. Un limite por IP aqui cuenta TODO el trafico del broker como una
// sola IP y lo agota con una flota de sensores, tumbando a todos los
// clientes de golpe (ver incidente 2026-11-05: 429 en /acl -> desconexion
// masiva de predios).
export class MqttAuthRouter {
  static get routes() {
    const router = Router();
    const controller = MqttAuthDependencies.createController();

    router.use(mqttAuthGuard);
    router.post("/auth", controller.auth);
    router.post("/acl", controller.acl);

    return router;
  }
}
