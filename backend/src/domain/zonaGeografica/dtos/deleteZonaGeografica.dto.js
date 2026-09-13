import { Validators } from "../../../config/validators.js";

export class DeleteZonaGeograficaDTO {
  constructor(id) {
    this.id = id;
  }

  static validate(id) {
    const errors = [];
    if (!id || String(id).trim() === "") errors.push("Missing id");
    if (!Validators.isValidId(id)) errors.push("ID not valid");
    return errors;
  }
}
