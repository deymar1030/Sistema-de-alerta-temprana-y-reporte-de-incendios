import { RealtimeNotifierPort } from "../ports/realtimeNotifier.port.js";

// Implementacion "nula": no emite nada por WebSocket. Permite levantar
// api/ o mqtt/ sin websocketManager montado (ver docs/GuiaTiempoReal.md §4)
// -- las lecturas y alertas se siguen guardando igual, solo no se avisa
// en vivo.
export class NoopRealtimeNotifier extends RealtimeNotifierPort {
  async emitAlertaConfirmada() {}
  async emitAlertaDescartada() {}
  async emitEnvioActualizado() {}
  async emitReporteCiudadano() {}
  async emitLecturaNueva() {}
}
