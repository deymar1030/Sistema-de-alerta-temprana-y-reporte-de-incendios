import { RealtimeNotifierPort } from "../api/application/realtime/ports/realtimeNotifier.port.js";

let instancia = null;

// Los routers (y los use cases que construyen) se armaron siempre ANTES de
// que exista el notifier real: el Server de socket.io necesita el
// httpServer, que a su vez envuelve la app de Express -- invertir ese
// orden rompe como engine.io detecta a Express como fallback (ver
// websocketManager/bootstrap.js). Este registro evita tocar ese orden:
// guarda la referencia real recien en app.js, y RegistryRealtimeNotifier
// la resuelve en cada llamada, no al construirse.
export const NotifierRegistry = {
  set(notifier) {
    instancia = notifier;
  },
};

export class RegistryRealtimeNotifier extends RealtimeNotifierPort {
  async emitAlertaConfirmada(...args) {
    return instancia?.emitAlertaConfirmada(...args);
  }

  async emitAlertaDescartada(...args) {
    return instancia?.emitAlertaDescartada(...args);
  }

  async emitEnvioActualizado(...args) {
    return instancia?.emitEnvioActualizado(...args);
  }

  async emitReporteCiudadano(...args) {
    return instancia?.emitReporteCiudadano(...args);
  }

  async emitLecturaNueva(...args) {
    return instancia?.emitLecturaNueva(...args);
  }

  async emitNotificacion(...args) {
    return instancia?.emitNotificacion(...args);
  }
}
