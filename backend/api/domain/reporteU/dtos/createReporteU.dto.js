const NIVELES_PRIORIDAD = ["BAJA", "MEDIA", "ALTA"];

export class CreateReporteUDTO {
  constructor({
    id_usuario,
    descripcion,
    tipo = null,
    nivel_prioridad = null,
    latitud = null,
    longitud = null,
    indicador = null,
    foto_url = null,
  }) {
    this.id_usuario = id_usuario;
    this.descripcion = descripcion;
    this.tipo = tipo;
    this.nivel_prioridad = nivel_prioridad;
    this.latitud = latitud;
    this.longitud = longitud;
    this.indicador = indicador;
    this.foto_url = foto_url;
  }

  static validate({ id_usuario, descripcion, nivel_prioridad }) {
    const errors = [];
    if (!id_usuario) errors.push("Missing id_usuario");
    if (!descripcion) errors.push("Missing descripcion");
    if (nivel_prioridad && !NIVELES_PRIORIDAD.includes(nivel_prioridad)) {
      errors.push(`nivel_prioridad must be one of: ${NIVELES_PRIORIDAD.join(", ")}`);
    }
    return errors;
  }
}
