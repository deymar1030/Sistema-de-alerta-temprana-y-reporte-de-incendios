import { RealtimeNotifierPort } from "../api/application/realtime/ports/realtimeNotifier.port.js";
import { RolNombres } from "../api/domain/rol/rolNombres.js";
import { ESTADOS_VALIDADOS } from "../api/domain/alerta/visibilidadAlerta.js";
import { rooms } from "./rooms.js";

export class SocketIoRealtimeNotifier extends RealtimeNotifierPort {
  constructor(io) {
    super();
    this.io = io;
  }

  // Una alerta validada (confirmada/en atencion/cerrada) es publica. Mientras
  // esta EN_EVALUACION o si se DESCARTA, solo la ve el ADMIN y, si ya hubo
  // pico critico, las instituciones a las que se envio. Antes todo iba por
  // io.emit: ciudadanos y jefes recibian alertas sin validar, y cada lectura
  // de un predio en evaluacion los hacia recargar.
  destinosAlerta(alerta) {
    if (ESTADOS_VALIDADOS.includes(alerta?.estado)) return this.io;
    const destinos = [rooms.rol(RolNombres.ADMIN)];
    for (const envio of alerta?.instituciones_notificadas ?? []) {
      if (envio?.id_institucion != null) destinos.push(rooms.institucion(envio.id_institucion));
    }
    return this.io.to(destinos);
  }

  async emitAlertaAbierta(alerta) { this.destinosAlerta(alerta).emit('alerta:abierta', alerta); }
  async emitAlertaActualizada(alerta) { this.destinosAlerta(alerta).emit('alerta:actualizada', alerta); }

  async emitAlertaConfirmada(alerta) {
    this.destinosAlerta(alerta).emit("alerta:confirmada", alerta);
  }

  async emitAlertaDescartada(alerta) {
    this.destinosAlerta(alerta).emit("alerta:descartada", alerta);
  }

  async emitEnvioActualizado(envio) {
    this.io.to(rooms.institucion(envio.id_institucion)).emit("notificacion:envio-actualizado", envio);
  }

  // Solo quienes gestionan reportes: antes iba a todos y cada reporte hacia
  // recargar el inicio de todos los ciudadanos conectados.
  async emitReporteCiudadano(reporte) {
    this.io.to([rooms.rol(RolNombres.ADMIN), rooms.rol(RolNombres.JEFE_INSTITUCION), rooms.usuario(reporte.id_usuario)])
      .emit("notificacion:reporte-ciudadano", reporte);
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

  async emitMensajeChat(mensaje) {
    const room = mensaje.tipo_canal === "CATEGORIA" ? rooms.chatCategoria(mensaje.categoria) : rooms.chatGlobal();
    this.io.to(room).emit("chat:mensaje-nuevo", mensaje);
  }
}
