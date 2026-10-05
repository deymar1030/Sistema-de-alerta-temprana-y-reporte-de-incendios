export class ResponseNotificacionDTO {
  constructor({ id_notificacion, id_alerta, tipo, titulo, mensaje, fecha_hora, leida }) {
    this.id_notificacion = id_notificacion;
    this.id_alerta = id_alerta;
    this.tipo = tipo;
    this.titulo = titulo;
    this.mensaje = mensaje;
    this.fecha_hora = fecha_hora;
    this.leida = leida;
  }

  static fromEntity(notificacion) {
    return new ResponseNotificacionDTO({
      id_notificacion: notificacion.id_notificacion,
      id_alerta: notificacion.id_alerta,
      tipo: notificacion.tipo,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      fecha_hora: notificacion.fecha_hora,
      leida: notificacion.leida,
    });
  }
}
