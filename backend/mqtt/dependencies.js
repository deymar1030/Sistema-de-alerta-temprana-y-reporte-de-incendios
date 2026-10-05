import { createMqttMessageHandler } from "./subscriber.js";

// Punto de extension: hoy el handler solo reenvia la lectura cruda por
// WebSocket (lectura:nueva), sin guardarla ni correr el motor de
// deteccion -- esa logica de negocio (tabla lectura, validacion de rango,
// alertas) la implementan los devs a partir de issues/05-lecturas.md e
// issues/06-alertas.md, reemplazando este `onLectura` por el caso de uso
// real (ver docs/GuiaTiempoReal.md §2 para el diseño completo).
export function createLecturaHandler(notifier) {
  return createMqttMessageHandler(async (lectura) => {
    await notifier.emitLecturaNueva(lectura);
  });
}
