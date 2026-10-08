const TIPOS = ["ALERTA", "ENVIO", "REPORTE", "SISTEMA"];

export class CreateNotificacionDTO {
  constructor({ id_usuario, id_usuario_emisor = null, id_alerta = null, tipo, titulo, mensaje }) {
    this.id_usuario = id_usuario;
    this.id_usuario_emisor = id_usuario_emisor;
    this.id_alerta = id_alerta;
    this.tipo = tipo;
    this.titulo = titulo;
    this.mensaje = mensaje;
  }

  static validate({ id_usuario, tipo, titulo, mensaje }) {
    const errors = [];
    if (!id_usuario) errors.push("Missing id_usuario");
    if (!tipo) errors.push("Missing tipo");
    else if (!TIPOS.includes(tipo)) errors.push(`tipo must be one of: ${TIPOS.join(", ")}`);
    if (!titulo) errors.push("Missing titulo");
    if (!mensaje) errors.push("Missing mensaje");
    return errors;
  }
}
