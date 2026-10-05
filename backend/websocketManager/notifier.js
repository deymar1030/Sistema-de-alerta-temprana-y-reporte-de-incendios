import { RealtimeNotifierPort } from "../api/application/realtime/ports/realtimeNotifier.port.js";
import { rooms } from "./rooms.js";

// Implementacion real del puerto (ver api/application/realtime/ports/
// realtimeNotifier.port.js): traduce cada aviso de negocio al evento de
// Socket.IO documentado en docs/EndpointsWebSockets.md §2.
//
// Nota de alcance: todavia no hay un rol/room de "operadores centrales"
// modelado (eso depende de la feature de autorizacion por rol, fuera de
// esta rama). Los 4 eventos que la documentacion dirige a "centrales" se
// mandan por ahora como broadcast a todos los conectados -- eso ya
// incluye, de paso, a cualquier usuario de la institucion involucrada,
// sin necesidad de emitir dos veces. Solo lectura:nueva se manda a una
// room especifica (sensor/predio), porque ese evento si puede ser de alto
// volumen (docs/EndpointsWebSockets.md §2.4) y no tiene sentido mandarlo
// a quien no esta viendo ese sensor/predio.
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
