export class ReporteUEntity {
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
  }
}
