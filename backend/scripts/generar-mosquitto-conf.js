import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

export function generarConf({
  template = fileURLToPath(new URL("../mqtt/mosquitto.tls.conf", import.meta.url)),
  secreto = process.env.MQTT_AUTH_SECRET,
  host = process.env.MQTT_AUTH_BACKEND_HOST || "host.docker.internal",
  puerto = process.env.MQTT_AUTH_BACKEND_PORT || process.env.PORT || "3000",
  destino = fileURLToPath(new URL("../mqtt/runtime/mosquitto.tls.generado.conf", import.meta.url)),
} = {}) {
  if (!secreto) throw new Error("MQTT_AUTH_SECRET requerida: debe ser el mismo secreto configurado en el backend");
  if (!/^[\x20-\x7e]+$/.test(secreto)) throw new Error("MQTT_AUTH_SECRET debe ser texto ASCII imprimible, sin saltos de linea");
  if (!/^[a-zA-Z0-9.-]+$/.test(host)) throw new Error("MQTT_AUTH_BACKEND_HOST invalido");
  if (!/^\d{1,5}$/.test(String(puerto))) throw new Error("MQTT_AUTH_BACKEND_PORT invalido");

  const contenido = readFileSync(template, "utf8")
    .replaceAll("__MQTT_AUTH_SECRET__", secreto)
    .replaceAll("__MQTT_AUTH_BACKEND_HOST__", host)
    .replaceAll("__MQTT_AUTH_BACKEND_PORT__", String(puerto));

  mkdirSync(dirname(destino), { recursive: true });
  writeFileSync(destino, contenido, { mode: 0o600 });
  return { destino };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { destino } = generarConf();
  console.log(`Configuracion de Mosquitto (TLS + auth HTTP contra el backend) generada en ${destino}.`);
}
