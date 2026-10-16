import { Validators } from "../../../config/validators.js";

export class VincularAlertaReporteUDTO {
  constructor({ id_alerta }) {
    this.id_alerta = id_alerta;
  }

  static validate(id, { id_alerta }) {
    const errors = [];
    if (!Validators.isValidId(id)) errors.push("ID not valid");
    if (!Validators.isValidId(id_alerta)) errors.push("id_alerta not valid");
    return errors;
  }
}
