import { GetInstitucionDTO } from "../../../domain/institucion/dtos/getInstitucion.dto.js";

export default class GetInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute(id) {
    const errors = GetInstitucionDTO.validate(id);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const institucion = await this.institucionRepository.findById(id);

    if (!institucion) {
      throw new Error("Institucion not found");
    }

    return institucion;
  }
}