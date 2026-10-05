export class CreateInstitucionDTO {
  constructor({
    categoria,
    detalle = null,
    nombre,
    razon_social = null,
    telefono_ins = null,
  }) {
    this.categoria = categoria;
    this.detalle = detalle;
    this.nombre = nombre;
    this.razon_social = razon_social;
    this.telefono_ins = telefono_ins;
  }

  static validate({ categoria, nombre }) {
    const errors = [];

    if (!categoria) errors.push("Missing categoria");
    if (!nombre) errors.push("Missing nombre");

    return errors;
  }
}