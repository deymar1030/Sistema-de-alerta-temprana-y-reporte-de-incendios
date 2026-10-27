export class NotificacionEntity {
  constructor({
    id_notificacion,
    id_usuario,
    id_usuario_emisor = null,
    id_alerta,
    tipo,
    titulo,
    mensaje,
    fecha_hora,
    leida,
  }) {
    this.id_notificacion = id_notificacion;
    this.id_usuario = id_usuario;
    this.id_usuario_emisor = id_usuario_emisor;
    this.id_alerta = id_alerta;
    this.tipo = tipo;
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.fecha_hora = fecha_hora;
    this.leida = leida;
  }
}
