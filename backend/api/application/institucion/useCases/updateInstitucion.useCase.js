import { UpdateInstitucionDTO } from "../../../domain/institucion/dtos/updateInstitucion.dto.js";

export default class UpdateInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute(id, institucionData) {
    const errors = UpdateInstitucionDTO.validate(id, institucionData);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existingInstitucion =
      await this.institucionRepository.findById(id);

    if (!existingInstitucion) {
      throw new Error("Institucion not found");
    }

    const institucionDTO =
      new UpdateInstitucionDTO(institucionData);

    return await this.institucionRepository.update(
      id,
      institucionDTO
    );
  }
}