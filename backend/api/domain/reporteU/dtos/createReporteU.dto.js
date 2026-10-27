const NIVELES_PRIORIDAD = ["BAJA", "MEDIA", "ALTA"];
const TIPOS_UBICACION = ["EN_SITIO", "CERCANA"];

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
    ubicacion_tipo = null,
  }) {
    this.id_usuario = id_usuario;
    this.descripcion = descripcion;
    this.tipo = tipo;
    this.nivel_prioridad = nivel_prioridad;
    this.latitud = latitud;
    this.longitud = longitud;
    this.indicador = indicador;
    this.foto_url = foto_url;
    this.ubicacion_tipo = ubicacion_tipo;
  }

  static validate({ id_usuario, descripcion, nivel_prioridad, ubicacion_tipo }) {
    const errors = [];
    if (!id_usuario) errors.push("Missing id_usuario");
    if (!descripcion) errors.push("Missing descripcion");
    if (nivel_prioridad && !NIVELES_PRIORIDAD.includes(nivel_prioridad)) {
      errors.push(`nivel_prioridad must be one of: ${NIVELES_PRIORIDAD.join(", ")}`);
    }
    if (ubicacion_tipo && !TIPOS_UBICACION.includes(ubicacion_tipo)) {
      errors.push(`ubicacion_tipo must be one of: ${TIPOS_UBICACION.join(", ")}`);
    }
    return errors;
  }
}
