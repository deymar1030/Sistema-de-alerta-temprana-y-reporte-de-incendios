import { RealtimeNotifierPort } from "../api/application/realtime/ports/realtimeNotifier.port.js";
import { rooms } from "./rooms.js";

export class SocketIoRealtimeNotifier extends RealtimeNotifierPort {
  constructor(io) {
    super();
    this.io = io;
  }

  async emitAlertaConfirmada(alerta) {
    this.io.emit("alerta:confirmada", alerta);
  }

  async emitAlertaDescartada(alerta) {
    this.io.emit("alerta:descartada", alerta);
  }

  async emitEnvioActualizado(envio) {
    this.io.emit("notificacion:envio-actualizado", envio);
  }

  async emitReporteCiudadano(reporte) {
    this.io.emit("notificacion:reporte-ciudadano", reporte);
  }

  async emitLecturaNueva(lectura) {
    if (lectura.id_sensor) this.io.to(rooms.sensor(lectura.id_sensor)).emit("lectura:nueva", lectura);
    if (lectura.id_predio) this.io.to(rooms.predio(lectura.id_predio)).emit("lectura:nueva", lectura);
  }
}
