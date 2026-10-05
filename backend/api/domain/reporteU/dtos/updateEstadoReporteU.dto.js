import { Validators } from "../../../config/validators.js";

const ESTADOS = ["RECIBIDO", "EN_REVISION", "VALIDADO", "DESCARTADO", "ATENDIDO"];

export class UpdateEstadoReporteUDTO {
  constructor({ estado }) {
    this.estado = estado;
  }

  static validate(id, { estado }) {
    const errors = [];
    if (!Validators.isValidId(id)) errors.push("ID not valid");
    if (!estado) errors.push("Missing estado");
    else if (!ESTADOS.includes(estado)) {
      errors.push(`estado must be one of: ${ESTADOS.join(", ")}`);
    }
    return errors;
  }
}
