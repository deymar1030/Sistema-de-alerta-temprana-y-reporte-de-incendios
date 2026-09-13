import { DeleteZonaGeograficaDTO } from "../../../domain/zonaGeografica/dtos/deleteZonaGeografica.dto.js";

export default class DeleteZonaGeograficaUseCase {
  constructor(zonaGeograficaRepository) {
    this.zonaGeograficaRepository = zonaGeograficaRepository;
  }

  async execute(id) {
    const errors = DeleteZonaGeograficaDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existingZona = await this.zonaGeograficaRepository.findById(id);
    if (!existingZona) {
      throw new Error("Zona geografica not found");
    }

    return await this.zonaGeograficaRepository.delete(id);
  }
}
