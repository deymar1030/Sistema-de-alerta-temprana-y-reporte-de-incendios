import { Validators } from "../../../config/validators.js";

export class UpdateInstitucionDTO {
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

  static validate(id, { categoria, nombre }) {
    const errors = [];

    if (!Validators.isValidId(id)) {
      errors.push("ID not valid");
    }

    if (!categoria) {
      errors.push("Missing categoria");
    }

    if (!nombre) {
      errors.push("Missing nombre");
    }

    return errors;
  }
}