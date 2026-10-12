import mqtt from "mqtt";
import { envs } from "../api/config/envs.js";
import { readFileSync } from 'node:fs';

export function connectMqttClient(config = envs) {
  if (!config.MQTT_PASSWORD) throw new Error('MQTT_PASSWORD requerida: ejecutar npm run mqtt:provisionar y usar dev:mqtt');
  const url = new URL(config.MQTT_BROKER_URL);
  if (!['mqtt:', 'mqtts:'].includes(url.protocol)) throw new Error('MQTT_BROKER_URL debe usar mqtt:// o mqtts://');
  if (config.NODE_ENV === 'production' && url.protocol !== 'mqtts:') throw new Error('MQTT requiere TLS en produccion');
  const client = mqtt.connect(config.MQTT_BROKER_URL, {
    clientId: config.MQTT_CLIENT_ID,
    username: config.MQTT_USERNAME,
    password: config.MQTT_PASSWORD,
    protocolVersion: 4,
    clean: false,
    manualConnect: true,
    resubscribe: false,
    queueQoSZero: false,
    ca: config.MQTT_CA_FILE ? readFileSync(config.MQTT_CA_FILE) : undefined,
    rejectUnauthorized: true,
    reconnectPeriod: 2000,
    connectTimeout: 10000,
  });

  client.on("connect", () => {
    console.log(`[mqtt] conectado a ${url.hostname}:${url.port || 1883} como "${config.MQTT_CLIENT_ID}"`);
  });

  client.on("error", (error) => {
    console.error("[mqtt] error de conexion:", error.message);
  });

  return client;
}
