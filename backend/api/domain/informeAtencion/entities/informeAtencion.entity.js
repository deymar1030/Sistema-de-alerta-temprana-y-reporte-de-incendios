export class InformeAtencionEntity {
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
}
