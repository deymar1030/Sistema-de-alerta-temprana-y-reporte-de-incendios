import { Validators } from "../../../config/validators.js";

export default class GetJurisdiccionesInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute(id_institucion) {
    if (!Validators.isValidId(id_institucion)) {
      throw new Error("Validation errors: ID not valid");
    }

    const institucion = await this.institucionRepository.findById(id_institucion);
    if (!institucion) {
      throw new Error("Institucion not found");
    }

    return await this.institucionRepository.findJurisdicciones(id_institucion);
  }
}
