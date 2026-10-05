// Puerto que usan los casos de uso de api/ y el consumidor mqtt/ para
// avisar que paso algo, sin saber que existe Socket.IO. La implementacion
// real vive en websocketManager/notifier.js (ver docs/GuiaTiempoReal.md §3).
// Si no hay websocketManager montado, se inyecta NoopRealtimeNotifier en su
// lugar (ver noopRealtimeNotifier.js) para que api/ y mqtt/ sigan
// funcionando sin avisar en vivo.
export class RealtimeNotifierPort {
  async emitAlertaConfirmada(alerta) {
    throw new Error("Method not implemented");
  }

  async emitAlertaDescartada(alerta) {
    throw new Error("Method not implemented");
  }

  // notificacion:envio-actualizado (EndpointsWebSockets.md §2.2)
  async emitEnvioActualizado(envio) {
    throw new Error("Method not implemented");
  }

  // notificacion:reporte-ciudadano (EndpointsWebSockets.md §2.2)
  async emitReporteCiudadano(reporte) {
    throw new Error("Method not implemented");
  }

  async emitLecturaNueva(lectura) {
    throw new Error("Method not implemented");
  }
}
