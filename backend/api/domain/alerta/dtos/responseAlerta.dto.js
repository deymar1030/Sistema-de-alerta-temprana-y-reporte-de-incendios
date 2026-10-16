function toFechaString(value) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function toHoraString(value) {
  if (!value) return null;
  return value.toISOString().slice(11, 19);
}

export class ResponseAlertaDTO {
  constructor({ id_alerta, fecha, hora, estado, puntaje, clasificacion, fecha_confirmacion, fecha_cierre }) {
    this.id_alerta = id_alerta;
    this.fecha = fecha;
    this.hora = hora;
    this.estado = estado;
    this.puntaje = puntaje;
    this.clasificacion = clasificacion;
    this.fecha_confirmacion = fecha_confirmacion;
    this.fecha_cierre = fecha_cierre;
  }

  static fromEntity(alerta) {
    return new ResponseAlertaDTO({
      id_alerta: alerta.id_alerta,
      fecha: toFechaString(alerta.fecha),
      hora: toHoraString(alerta.hora),
      estado: alerta.estado,
      puntaje: alerta.puntaje != null ? Number(alerta.puntaje) : null,
      clasificacion: alerta.clasificacion,
      fecha_confirmacion: alerta.fecha_confirmacion,
      fecha_cierre: alerta.fecha_cierre,
    });
  }
}

export class ResponseAlertaDetalleDTO extends ResponseAlertaDTO {
  constructor(data) {
    super(data);
    this.predio = data.predio;
    this.lecturas = data.lecturas;
    this.instituciones_notificadas = data.instituciones_notificadas;
    this.reporte_origen = data.reporte_origen;
  }

  static fromEntity(alerta, { predio, lecturas, instituciones_notificadas, reporte_origen }) {
    const base = ResponseAlertaDTO.fromEntity(alerta);
    return new ResponseAlertaDetalleDTO({ ...base, predio, lecturas, instituciones_notificadas, reporte_origen });
  }
}
