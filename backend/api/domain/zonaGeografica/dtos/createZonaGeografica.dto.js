export class CreateZonaGeograficaDTO {
  constructor({
    nombre,
    departamento,
    municipio,
    descripcion = null,
    estado = null,
    densidad_poblacional = null,
  }) {
    this.nombre = nombre;
    this.departamento = departamento;
    this.municipio = municipio;
    this.descripcion = descripcion;
    this.estado = estado;
    this.densidad_poblacional = densidad_poblacional;
  }

  static validate({ nombre, departamento, municipio }) {
    const errors = [];
    if (!nombre) errors.push("Missing nombre");
    if (!departamento) errors.push("Missing departamento");
    if (!municipio) errors.push("Missing municipio");
    return errors;
  }
}
