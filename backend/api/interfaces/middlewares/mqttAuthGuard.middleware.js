import { envs } from "../../config/envs.js";

// Mosquitto-go-auth no soporta cabeceras secretas propias; el User-Agent es
// la unica cabecera personalizable que expone, asi que se usa como secreto
// compartido. Se complementa con que este servidor solo escucha en un
// puerto interno no expuesto publicamente.
export function mqttAuthGuard(req, res, next) {
  if (!envs.MQTT_AUTH_SECRET || req.get("User-Agent") !== envs.MQTT_AUTH_SECRET) {
    return res.status(404).end();
  }
  next();
}
