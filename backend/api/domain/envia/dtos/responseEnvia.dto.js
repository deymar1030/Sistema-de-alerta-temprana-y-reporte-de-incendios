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
  constructor({ id_institucion, nombre, estado, fecha_envio, fecha_actualizacion, ruta, ruta_calculada_en, ruta_error }) {
    this.id_institucion = id_institucion;
    this.nombre = nombre;
    this.estado = estado;
    this.fecha_envio = fecha_envio;
    this.fecha_actualizacion = fecha_actualizacion;
    this.ruta = ruta;
    this.ruta_calculada_en = ruta_calculada_en;
    this.ruta_error = ruta_error;
  }

  static fromEntity(envia) {
    let ruta = null;
    if (envia.ruta_json) {
      try { ruta = JSON.parse(envia.ruta_json); } catch { ruta = null; }
    }
    return new ResponseInstitucionNotificadaDTO({
      id_institucion: envia.id_institucion,
      nombre: envia.institucion?.nombre,
      estado: envia.estado,
      fecha_envio: envia.fecha_envio,
      fecha_actualizacion: envia.fecha_actualizacion,
      ruta,
      ruta_calculada_en: envia.ruta_calculada_en ?? null,
      ruta_error: envia.ruta_error ?? null,
    });
  }
}
