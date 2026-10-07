function toFechaString(value) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

function toHoraString(value) {
  if (!value) return null;
  return value.toISOString().slice(11, 19);
}

export class ResponseInformeAtencionDTO {
  constructor({
    id_informe_atencion,
    id_alerta,
    id_institucion,
    id_usuario,
    estado,
    fecha_incidente,
    hora_recepcion,
    hora_salida,
    hora_llegada,
    hora_control,
    hora_finalizacion,
    personal,
    vehiculos,
    personas_afectadas,
    personas_evacuadas,
    heridos,
    fallecidos,
    danos_materiales,
    causa,
    acciones,
    observaciones,
    recomendaciones,
    fecha_envio,
  }) {
    this.id_informe_atencion = id_informe_atencion;
    this.id_alerta = id_alerta;
    this.id_institucion = id_institucion;
    this.id_usuario = id_usuario;
    this.estado = estado;
    this.fecha_incidente = fecha_incidente;
    this.hora_recepcion = hora_recepcion;
    this.hora_salida = hora_salida;
    this.hora_llegada = hora_llegada;
    this.hora_control = hora_control;
    this.hora_finalizacion = hora_finalizacion;
    this.personal = personal;
    this.vehiculos = vehiculos;
    this.personas_afectadas = personas_afectadas;
    this.personas_evacuadas = personas_evacuadas;
    this.heridos = heridos;
    this.fallecidos = fallecidos;
    this.danos_materiales = danos_materiales;
    this.causa = causa;
    this.acciones = acciones;
    this.observaciones = observaciones;
    this.recomendaciones = recomendaciones;
    this.fecha_envio = fecha_envio;
  }

  static fromEntity(informe) {
    return new ResponseInformeAtencionDTO({
      id_informe_atencion: informe.id_informe_atencion,
      id_alerta: informe.id_alerta,
      id_institucion: informe.id_institucion,
      id_usuario: informe.id_usuario,
      estado: informe.estado,
      fecha_incidente: toFechaString(informe.fecha_incidente),
      hora_recepcion: toHoraString(informe.hora_recepcion),
      hora_salida: toHoraString(informe.hora_salida),
      hora_llegada: toHoraString(informe.hora_llegada),
      hora_control: toHoraString(informe.hora_control),
      hora_finalizacion: toHoraString(informe.hora_finalizacion),
      personal: informe.personal,
      vehiculos: informe.vehiculos,
      personas_afectadas: informe.personas_afectadas,
      personas_evacuadas: informe.personas_evacuadas,
      heridos: informe.heridos,
      fallecidos: informe.fallecidos,
      danos_materiales: informe.danos_materiales,
      causa: informe.causa,
      acciones: informe.acciones,
      observaciones: informe.observaciones,
      recomendaciones: informe.recomendaciones,
      fecha_envio: informe.fecha_envio,
    });
  }
}
