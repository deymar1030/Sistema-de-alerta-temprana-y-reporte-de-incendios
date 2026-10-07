const ESTADOS = ["BORRADOR", "COMPLETADO"];

export class CreateInformeAtencionDTO {
  constructor({
    id_alerta,
    id_institucion,
    id_usuario,
    estado = "BORRADOR",
    fecha_incidente = null,
    hora_recepcion = null,
    hora_salida = null,
    hora_llegada = null,
    hora_control = null,
    hora_finalizacion = null,
    personal = null,
    vehiculos = null,
    personas_afectadas = null,
    personas_evacuadas = null,
    heridos = null,
    fallecidos = null,
    danos_materiales = null,
    causa = null,
    acciones = null,
    observaciones = null,
    recomendaciones = null,
  }) {
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
  }

  static validate({ id_alerta, id_institucion, id_usuario, estado }) {
    const errors = [];

    if (!id_alerta) errors.push("Missing id_alerta");
    if (!id_institucion) errors.push("Missing id_institucion");
    if (!id_usuario) errors.push("Missing id_usuario");
    if (estado !== undefined && !ESTADOS.includes(estado)) {
      errors.push(`estado must be one of: ${ESTADOS.join(", ")}`);
    }

    return errors;
  }
}
