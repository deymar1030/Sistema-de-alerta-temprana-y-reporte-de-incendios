import { RealtimeNotifierPort } from "../ports/realtimeNotifier.port.js";

export class NoopRealtimeNotifier extends RealtimeNotifierPort {
  async emitAlertaAbierta() {}
  async emitAlertaActualizada() {}
  async emitAlertaConfirmada() {}
  async emitAlertaDescartada() {}
  async emitEnvioActualizado() {}
  async emitReporteCiudadano() {}
  async emitLecturaNueva() {}
  async emitNotificacion() {}
}
