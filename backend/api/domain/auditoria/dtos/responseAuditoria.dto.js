// Refleja 1:1 las columnas de `auditoria` (eventos generales del sistema).
// Solo lectura: no hay create/update/delete para esta tabla a proposito --
// la escriben triggers de BD a cargo de seguridad, no el backend.
export class ResponseAuditoriaDTO {
  constructor({ id_auditoria, evento, fecha_hora, detalle }) {
    this.id_auditoria = id_auditoria;
    this.evento = evento;
    this.fecha_hora = fecha_hora;
    this.detalle = detalle;
  }

  static fromEntity(auditoria) {
    return new ResponseAuditoriaDTO({
      id_auditoria: auditoria.id_auditoria,
      evento: auditoria.evento,
      fecha_hora: auditoria.fecha_hora,
      detalle: auditoria.detalle,
    });
  }
}
