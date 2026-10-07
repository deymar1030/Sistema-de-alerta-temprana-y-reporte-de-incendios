import { createMqttMessageHandler } from "./subscriber.js";

export function createLecturaHandler(notifier) {
  return createMqttMessageHandler(async (lectura) => {
    console.log(
      `[mqtt] lectura recibida: predio=${lectura.id_predio} sensor=${lectura.id_sensor} valor=${lectura.valor} fecha_hora=${lectura.fecha_hora.toISOString()}`,
    );
    await notifier.emitLecturaNueva(lectura);
  });
}
