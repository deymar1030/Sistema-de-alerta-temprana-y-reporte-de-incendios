export class RealtimeNotifierPort {
  async emitAlertaAbierta() { throw new Error('Method not implemented'); }
  async emitAlertaActualizada() { throw new Error('Method not implemented'); }
  async emitAlertaConfirmada(alerta) {
    throw new Error("Method not implemented");
  }

  async emitAlertaDescartada(alerta) {
    throw new Error("Method not implemented");
  }

  async emitEnvioActualizado(envio) {
    throw new Error("Method not implemented");
  }

  async emitReporteCiudadano(reporte) {
    throw new Error("Method not implemented");
  }

  async emitLecturaNueva(lectura) {
    throw new Error("Method not implemented");
  }

  async emitNotificacion(notificacion) {
    throw new Error("Method not implemented");
  }
}
