import { RealtimeNotifierPort } from "../api/application/realtime/ports/realtimeNotifier.port.js";
import { rooms } from "./rooms.js";

export class SocketIoRealtimeNotifier extends RealtimeNotifierPort {
  constructor(io) {
    super();
    this.io = io;
  }

  async emitAlertaAbierta(alerta) { this.io.emit('alerta:abierta', alerta); }
  async emitAlertaActualizada(alerta) { this.io.emit('alerta:actualizada', alerta); }

  async emitAlertaConfirmada(alerta) {
    this.io.emit("alerta:confirmada", alerta);
  }

  async emitAlertaDescartada(alerta) {
    this.io.emit("alerta:descartada", alerta);
  }

  async emitEnvioActualizado(envio) {
    this.io.to(rooms.institucion(envio.id_institucion)).emit("notificacion:envio-actualizado", envio);
  }

  async emitReporteCiudadano(reporte) {
    this.io.emit("notificacion:reporte-ciudadano", reporte);
  }

  async emitLecturaNueva(lectura) {
    const destinos = [];
    if (lectura.id_sensor) destinos.push(rooms.sensor(lectura.id_sensor));
    if (lectura.id_predio) destinos.push(rooms.predio(lectura.id_predio));
    // Union de rooms: un usuario suscrito a ambos recibe la lectura una sola vez.
    if (destinos.length) this.io.to(destinos).emit("lectura:nueva", lectura);
  }

  async emitNotificacion(notificacion) {
    this.io.to(rooms.usuario(notificacion.id_usuario)).emit("notificacion:nueva", notificacion);
  }
}
