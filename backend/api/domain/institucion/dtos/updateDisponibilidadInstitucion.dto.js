import { Validators } from "../../../config/validators.js";

export const DISPONIBILIDAD_OPERATIVA = ["DISPONIBLE", "ATENDIENDO", "NO_DISPONIBLE"];

export class UpdateDisponibilidadInstitucionDTO {
  constructor({ disponibilidad_operativa }) {
    this.disponibilidad_operativa = disponibilidad_operativa;
  }

  static validate(id, { disponibilidad_operativa }) {
    const errors = [];

    if (!Validators.isValidId(id)) errors.push("ID not valid");
    if (!disponibilidad_operativa) errors.push("Missing disponibilidad_operativa");
    else if (!DISPONIBILIDAD_OPERATIVA.includes(disponibilidad_operativa)) {
      errors.push(`disponibilidad_operativa must be one of: ${DISPONIBILIDAD_OPERATIVA.join(", ")}`);
    }

    return errors;
  }
}
