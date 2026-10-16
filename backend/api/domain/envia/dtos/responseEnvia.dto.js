export class ResponseEnvioDTO {
  constructor({ id_alerta, id_institucion, estado, fecha_envio, fecha_actualizacion }) {
    this.id_alerta = id_alerta;
    this.id_institucion = id_institucion;
    this.estado = estado;
    this.fecha_envio = fecha_envio;
    this.fecha_actualizacion = fecha_actualizacion;
  }

  static fromEntity(envia) {
    return new ResponseEnvioDTO({
      id_alerta: envia.id_alerta,
      id_institucion: envia.id_institucion,
      estado: envia.estado,
      fecha_envio: envia.fecha_envio,
      fecha_actualizacion: envia.fecha_actualizacion,
    });
  }
}

export class ResponseInstitucionNotificadaDTO {
  constructor({ id_institucion, nombre, estado, fecha_envio, fecha_actualizacion }) {
    this.id_institucion = id_institucion;
    this.nombre = nombre;
    this.estado = estado;
    this.fecha_envio = fecha_envio;
    this.fecha_actualizacion = fecha_actualizacion;
  }

  static fromEntity(envia) {
    return new ResponseInstitucionNotificadaDTO({
      id_institucion: envia.id_institucion,
      nombre: envia.institucion?.nombre,
      estado: envia.estado,
      fecha_envio: envia.fecha_envio,
      fecha_actualizacion: envia.fecha_actualizacion,
    });
  }
}
