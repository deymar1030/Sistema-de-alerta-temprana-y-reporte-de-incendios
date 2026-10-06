import { Validators } from "../../../config/validators.js";

export class UpdateEstadoEnvioDTO {
  constructor(id_alerta, id_institucion) {
    this.id_alerta = id_alerta;
    this.id_institucion = id_institucion;
  }

  static validate(id_alerta, id_institucion) {
    const errors = [];

    if (!id_alerta || String(id_alerta).trim() === "") {
      errors.push("Missing id_alerta");
    }

    if (!Validators.isValidId(id_alerta)) {
      errors.push("id_alerta not valid");
    }

    if (!id_institucion || String(id_institucion).trim() === "") {
      errors.push("Missing id_institucion");
    }

    if (!Validators.isValidId(id_institucion)) {
      errors.push("id_institucion not valid");
    }

    return errors;
  }
}