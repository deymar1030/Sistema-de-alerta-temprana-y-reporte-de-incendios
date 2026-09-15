import { DeleteInstitucionDTO } from "../../../domain/institucion/dtos/deleteInstitucion.dto.js";

export default class DeleteInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute(id) {
    const errors = DeleteInstitucionDTO.validate(id);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existingInstitucion =
      await this.institucionRepository.findById(id);

    if (!existingInstitucion) {
      throw new Error("Institucion not found");
    }

    return await this.institucionRepository.delete(id);
  }
}