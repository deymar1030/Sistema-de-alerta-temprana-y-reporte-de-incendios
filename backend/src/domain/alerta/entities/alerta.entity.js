export class AlertaEntity {
  constructor({
    id_alerta,
    fecha,
    hora,
    estado,
    puntaje,
    clasificacion,
    fecha_confirmacion,
    fecha_cierre,
  }) {
    this.id_alerta = id_alerta;
    this.fecha = fecha;
    this.hora = hora;
    this.estado = estado;
    this.puntaje = puntaje;
    this.clasificacion = clasificacion;
    this.fecha_confirmacion = fecha_confirmacion;
    this.fecha_cierre = fecha_cierre;
  }
}