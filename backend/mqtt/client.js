import mqtt from "mqtt";
import { envs } from "../api/config/envs.js";

export function connectMqttClient() {
  const client = mqtt.connect(envs.MQTT_BROKER_URL, {
    clientId: envs.MQTT_CLIENT_ID,
    username: envs.MQTT_USERNAME,
    password: envs.MQTT_PASSWORD,
    reconnectPeriod: 2000,
  });

  client.on("connect", () => {
    console.log(`[mqtt] conectado a ${envs.MQTT_BROKER_URL} como "${envs.MQTT_CLIENT_ID}"`);
  });

  client.on("error", (error) => {
    console.error("[mqtt] error de conexion:", error.message);
  });

  return client;
}
