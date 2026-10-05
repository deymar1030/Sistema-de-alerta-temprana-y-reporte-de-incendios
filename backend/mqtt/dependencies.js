import { createMqttMessageHandler } from "./subscriber.js";

export function createLecturaHandler(notifier) {
  return createMqttMessageHandler(async (lectura) => {
    await notifier.emitLecturaNueva(lectura);
  });
}
