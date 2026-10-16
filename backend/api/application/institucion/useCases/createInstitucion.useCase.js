import { CreateInstitucionDTO } from "../../../domain/institucion/dtos/createInstitucion.dto.js";
import { InstitucionEntity } from "../../../domain/institucion/entities/institucion.entity.js";

export default class CreateInstitucionUseCase {
  constructor(institucionRepository) {
    this.institucionRepository = institucionRepository;
  }

  async execute(institucionData) {
    const errors = CreateInstitucionDTO.validate(institucionData);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const institucionDTO = new CreateInstitucionDTO(institucionData);

    const institucionEntity = new InstitucionEntity({
      id_institucion: null,
      ...institucionDTO,
    });

    return await this.institucionRepository.create(institucionEntity);
  }
}