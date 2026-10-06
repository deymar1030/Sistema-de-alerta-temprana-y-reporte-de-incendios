export class ResponseEnvioDTO {
  constructor({
    id_alerta,
    id_institucion,
    estado,
    fecha_envio,
    fecha_actualizacion,
  }) {
    this.id_alerta = id_alerta;
    this.id_institucion = id_institucion;
    this.estado = estado;
    this.fecha_envio = fecha_envio;
    this.fecha_actualizacion = fecha_actualizacion;
  }

  static fromEntity(envio) {
    return new ResponseEnvioDTO({
      id_alerta: envio.id_alerta,
      id_institucion: envio.id_institucion,
      estado: envio.estado,
      fecha_envio: envio.fecha_envio,
      fecha_actualizacion: envio.fecha_actualizacion,
    });
  }
}