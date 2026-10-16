import { Validators } from "../../../config/validators.js";

const ESTADOS = ["ACTIVO", "INACTIVO", "MANTENIMIENTO", "ERROR"];

export class UpdateSensorDTO {
  constructor(data) {
    Object.assign(this, data);
  }

  static validate(id, { estado }) {
    const errors = [];

    if (!Validators.isValidId(id)) errors.push("ID not valid");
    if (estado !== undefined && !ESTADOS.includes(estado)) {
      errors.push(`estado must be one of: ${ESTADOS.join(", ")}`);
    }

    return errors;
  }
}
