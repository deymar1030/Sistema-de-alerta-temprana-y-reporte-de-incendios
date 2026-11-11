// Refleja 1:1 las columnas de `auditoriau` (acciones por usuario). Solo
// lectura, mismo motivo que ResponseAuditoriaDTO.
export class ResponseAuditoriaUDTO {
  constructor({ id_auditoriau, id_usuario, accion, detalle, fecha_hora, ip_origen }) {
    this.id_auditoriau = id_auditoriau;
    this.id_usuario = id_usuario;
    this.accion = accion;
    this.detalle = detalle;
    this.fecha_hora = fecha_hora;
    this.ip_origen = ip_origen;
  }

  static fromEntity(auditoriau) {
    return new ResponseAuditoriaUDTO({
      id_auditoriau: auditoriau.id_auditoriau,
      id_usuario: auditoriau.id_usuario,
      accion: auditoriau.accion,
      detalle: auditoriau.detalle,
      fecha_hora: auditoriau.fecha_hora,
      ip_origen: auditoriau.ip_origen,
    });
  }
}
