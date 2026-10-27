import { UpdateZonaGeograficaDTO } from "../../../domain/zonaGeografica/dtos/updateZonaGeografica.dto.js";

export default class UpdateZonaGeograficaUseCase {
  constructor(zonaGeograficaRepository) {
    this.zonaGeograficaRepository = zonaGeograficaRepository;
  }

  async execute(id, zonaGeograficaData) {
    const errors = UpdateZonaGeograficaDTO.validate(id, zonaGeograficaData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existingZona = await this.zonaGeograficaRepository.findById(id);
    if (!existingZona) {
      throw new Error("Zona geografica not found");
    }

    const zonaGeograficaDTO = new UpdateZonaGeograficaDTO(zonaGeograficaData);

    return await this.zonaGeograficaRepository.update(id, zonaGeograficaDTO);
  }
}
