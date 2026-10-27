import { Validators } from "../../../config/validators.js";

export default class RemoveJurisdiccionInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute(id_institucion, id_zona) {
    const errors = [];
    if (!Validators.isValidId(id_institucion)) errors.push("ID not valid");
    if (!Validators.isValidId(id_zona)) errors.push("Missing id_zona");
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    await this.institucionRepository.removeJurisdiccion(id_institucion, id_zona);
  }
}
