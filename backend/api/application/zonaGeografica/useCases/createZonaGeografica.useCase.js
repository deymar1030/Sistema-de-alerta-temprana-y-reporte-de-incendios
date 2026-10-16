import { CreateZonaGeograficaDTO } from "../../../domain/zonaGeografica/dtos/createZonaGeografica.dto.js";
import { ZonaGeograficaEntity } from "../../../domain/zonaGeografica/entities/zonaGeografica.entity.js";

export default class CreateZonaGeograficaUseCase {
  constructor(zonaGeograficaRepository) {
    this.zonaGeograficaRepository = zonaGeograficaRepository;
  }

  async execute(zonaGeograficaData) {
    const errors = CreateZonaGeograficaDTO.validate(zonaGeograficaData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const zonaGeograficaDTO = new CreateZonaGeograficaDTO(zonaGeograficaData);

    const zonaGeograficaEntity = new ZonaGeograficaEntity({
      id_zona: null,
      ...zonaGeograficaDTO,
    });

    return await this.zonaGeograficaRepository.create(zonaGeograficaEntity);
  }
}
