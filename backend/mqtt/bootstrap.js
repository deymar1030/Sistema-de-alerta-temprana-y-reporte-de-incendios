import { connectMqttClient } from "./client.js";
import { createLecturaHandler } from "./dependencies.js";

const TOPICO_LECTURAS = "incendios/+/+";

// Conecta al broker, se suscribe a incendios/+/+ y registra el handler
// de mensajes (docs/GuiaTiempoReal.md §2). Devuelve el cliente mqtt para
// que app.js pueda cerrarlo si hace falta.
export function startMqttSubscriber({ notifier }) {
  const client = connectMqttClient();
  const handleMessage = createLecturaHandler(notifier);

  client.on("connect", () => {
    client.subscribe(TOPICO_LECTURAS, (error) => {
      if (error) {
        console.error(`[mqtt] no se pudo suscribir a "${TOPICO_LECTURAS}":`, error.message);
      } else {
        console.log(`[mqtt] suscrito a "${TOPICO_LECTURAS}"`);
      }
    });
  });

  client.on("message", handleMessage);

  return client;
}
