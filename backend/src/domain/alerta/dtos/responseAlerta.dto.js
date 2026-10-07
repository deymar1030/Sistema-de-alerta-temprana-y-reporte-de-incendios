export class ResponseAlertaDTO {
  constructor({
    id_alerta,
    fecha,
    hora,
    estado,
    puntaje,
    clasificacion,
    fecha_confirmacion,
    fecha_cierre,
    predio = undefined,
    lecturas = undefined,
    instituciones_notificadas = undefined,
    reporte_origen = undefined,
  }) {
    this.id_alerta = id_alerta;
    this.fecha = fecha;
    this.hora = hora;
    this.estado = estado;
    this.puntaje = puntaje;
    this.clasificacion = clasificacion;
    this.fecha_confirmacion = fecha_confirmacion;
    this.fecha_cierre = fecha_cierre;

    if (predio !== undefined) {
      this.predio = predio;
    }

    if (lecturas !== undefined) {
      this.lecturas = lecturas;
    }

    if (instituciones_notificadas !== undefined) {
      this.instituciones_notificadas = instituciones_notificadas;
    }

    if (reporte_origen !== undefined) {
      this.reporte_origen = reporte_origen;
    }
  }

  static fromEntity(alerta) {
    return new ResponseAlertaDTO({
      id_alerta: alerta.id_alerta,
      fecha: alerta.fecha,
      hora: alerta.hora,
      estado: alerta.estado,
      puntaje: alerta.puntaje,
      clasificacion: alerta.clasificacion,
      fecha_confirmacion: alerta.fecha_confirmacion,
      fecha_cierre: alerta.fecha_cierre,
      predio: alerta.predio,
      lecturas: alerta.lecturas,
      instituciones_notificadas: alerta.instituciones_notificadas,
      reporte_origen: alerta.reporte_origen,
    });
  }
}