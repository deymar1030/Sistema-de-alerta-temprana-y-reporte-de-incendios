export class ResponseReporteUDTO {
  constructor({
    id_reporte_u,
    id_usuario,
    descripcion,
    tipo,
    nivel_prioridad,
    estado,
    fecha_envio,
    latitud,
    longitud,
    indicador,
    foto_url,
    alerta_vinculada = null,
  }) {
    this.id_reporte_u = id_reporte_u;
    this.id_usuario = id_usuario;
    this.descripcion = descripcion;
    this.tipo = tipo;
    this.nivel_prioridad = nivel_prioridad;
    this.estado = estado;
    this.fecha_envio = fecha_envio;
    this.latitud = latitud;
    this.longitud = longitud;
    this.indicador = indicador;
    this.foto_url = foto_url;
    this.alerta_vinculada = alerta_vinculada;
  }

  static fromEntity(reporteU, alerta_vinculada = null) {
    return new ResponseReporteUDTO({
      id_reporte_u: reporteU.id_reporte_u,
      id_usuario: reporteU.id_usuario,
      descripcion: reporteU.descripcion,
      tipo: reporteU.tipo,
      nivel_prioridad: reporteU.nivel_prioridad,
      estado: reporteU.estado,
      fecha_envio: reporteU.fecha_envio,
      latitud: reporteU.latitud === null || reporteU.latitud === undefined ? null : Number(reporteU.latitud),
      longitud: reporteU.longitud === null || reporteU.longitud === undefined ? null : Number(reporteU.longitud),
      indicador: reporteU.indicador,
      foto_url: reporteU.foto_url,
      alerta_vinculada,
    });
  }
}
