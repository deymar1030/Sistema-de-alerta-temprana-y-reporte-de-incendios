import { Validators } from "../../../config/validators.js";

export class UpdateUsuarioDTO {
  constructor(data) {
    Object.assign(this, data);
  }

  static validate(id) {
    const errors = [];

    if (!Validators.isValidId(id)) errors.push("ID not valid");

    return errors;
  }
}
