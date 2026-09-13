import { GetZonaGeograficaDTO } from "../../../domain/zonaGeografica/dtos/getZonaGeografica.dto.js";

export default class GetZonaGeograficaUseCase {
  constructor(zonaGeograficaRepository) {
    this.zonaGeograficaRepository = zonaGeograficaRepository;
  }

  async execute(id) {
    const errors = GetZonaGeograficaDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const zonaGeografica = await this.zonaGeograficaRepository.findById(id);
    if (!zonaGeografica) {
      throw new Error("Zona geografica not found");
    }

    return zonaGeografica;
  }
}
