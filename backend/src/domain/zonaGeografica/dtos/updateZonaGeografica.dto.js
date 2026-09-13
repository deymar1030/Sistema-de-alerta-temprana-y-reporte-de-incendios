import { Validators } from "../../../config/validators.js";

export class UpdateZonaGeograficaDTO {
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

  static validate(id, { nombre, departamento, municipio }) {
    const errors = [];
    if (!Validators.isValidId(id)) errors.push("ID not valid");
    if (!nombre) errors.push("Missing nombre");
    if (!departamento) errors.push("Missing departamento");
    if (!municipio) errors.push("Missing municipio");
    return errors;
  }
}
