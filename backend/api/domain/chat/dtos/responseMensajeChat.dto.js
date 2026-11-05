export class ResponseMensajeChatDTO {
  constructor({
    id_mensaje,
    tipo_canal,
    categoria,
    id_usuario,
    id_institucion_emisor,
    contenido,
    tipo_mensaje,
    fecha_hora,
    usuario_nombre = null,
    institucion_nombre = null,
  }) {
    this.id_mensaje = id_mensaje;
    this.tipo_canal = tipo_canal;
    this.categoria = categoria;
    this.id_usuario = id_usuario;
    this.id_institucion_emisor = id_institucion_emisor;
    this.contenido = contenido;
    this.tipo_mensaje = tipo_mensaje;
    this.fecha_hora = fecha_hora;
    this.usuario_nombre = usuario_nombre;
    this.institucion_nombre = institucion_nombre;
  }

  static fromEntity(mensaje) {
    return new ResponseMensajeChatDTO({
      id_mensaje: mensaje.id_mensaje,
      tipo_canal: mensaje.tipo_canal,
      categoria: mensaje.categoria,
      id_usuario: mensaje.id_usuario,
      id_institucion_emisor: mensaje.id_institucion_emisor,
      contenido: mensaje.contenido,
      tipo_mensaje: mensaje.tipo_mensaje,
      fecha_hora: mensaje.fecha_hora,
      usuario_nombre: mensaje.usuario ? `${mensaje.usuario.nombre} ${mensaje.usuario.primer_apellido}` : null,
      institucion_nombre: mensaje.institucion?.nombre ?? null,
    });
  }
}
