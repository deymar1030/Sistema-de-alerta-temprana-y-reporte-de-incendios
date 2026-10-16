import { Validators } from "../../../config/validators.js";

export default class AddJurisdiccionInstitucionUseCase {
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

    const institucion = await this.institucionRepository.findById(id_institucion);
    if (!institucion) {
      throw new Error("Institucion not found");
    }

    return await this.institucionRepository.addJurisdiccion(id_institucion, id_zona);
  }
}
