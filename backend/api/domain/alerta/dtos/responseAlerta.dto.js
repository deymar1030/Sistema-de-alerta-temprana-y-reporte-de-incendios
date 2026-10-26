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

function toNumber(v) {
  return v === null || v === undefined ? null : Number(v);
}

// Ubicaciones de una alerta para el mapa: la del predio del sensor que la
// genero (via lectura) y/o la del reporte ciudadano que la origino (via
// genera_ru), segun cual de los dos exista.
export class ResponseAlertaMapaDTO {
  constructor({ id_alerta, estado, clasificacion, fecha, hora, ubicaciones }) {
    this.id_alerta = id_alerta;
    this.estado = estado;
    this.clasificacion = clasificacion;
    this.fecha = fecha;
    this.hora = hora;
    this.ubicaciones = ubicaciones;
  }

  static fromEntity(alerta) {
    const ubicaciones = [];

    const predio = alerta.lectura?.[0]?.sensor?.predio;
    if (predio?.latitud != null && predio?.longitud != null) {
      ubicaciones.push({
        origen: "PREDIO",
        id_predio: predio.id_predio,
        nombre: predio.nombre,
        latitud: toNumber(predio.latitud),
        longitud: toNumber(predio.longitud),
      });
    }

    const reporte = alerta.genera_ru?.[0]?.reporte_u;
    if (reporte?.latitud != null && reporte?.longitud != null) {
      ubicaciones.push({
        origen: "REPORTE",
        id_reporte_u: reporte.id_reporte_u,
        ubicacion_tipo: reporte.ubicacion_tipo,
        latitud: toNumber(reporte.latitud),
        longitud: toNumber(reporte.longitud),
      });
    }

    return new ResponseAlertaMapaDTO({
      id_alerta: alerta.id_alerta,
      estado: alerta.estado,
      clasificacion: alerta.clasificacion,
      fecha: toFechaString(alerta.fecha),
      hora: toHoraString(alerta.hora),
      ubicaciones,
    });
  }
}
