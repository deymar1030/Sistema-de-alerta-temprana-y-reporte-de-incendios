const CANALES = ["GLOBAL", "CATEGORIA"];
const CONTENIDO_MAX = 2000;

export class CreateMensajeChatDTO {
  constructor({ tipo_canal, categoria = null, id_usuario, id_institucion_emisor, contenido }) {
    this.tipo_canal = tipo_canal;
    this.categoria = categoria;
    this.id_usuario = id_usuario;
    this.id_institucion_emisor = id_institucion_emisor;
    this.contenido = contenido;
  }

  static validate({ tipo_canal, contenido }) {
    const errors = [];
    if (!tipo_canal) errors.push("Missing tipo_canal");
    else if (!CANALES.includes(tipo_canal)) errors.push(`tipo_canal must be one of: ${CANALES.join(", ")}`);
    if (!contenido || !String(contenido).trim()) errors.push("Missing contenido");
    else if (String(contenido).trim().length > CONTENIDO_MAX) errors.push(`contenido must be at most ${CONTENIDO_MAX} characters`);
    return errors;
  }
}
