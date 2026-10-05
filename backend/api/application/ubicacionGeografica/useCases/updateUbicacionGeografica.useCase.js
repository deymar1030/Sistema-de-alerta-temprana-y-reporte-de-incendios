import { UpdateUbicacionGeograficaDTO } from "../../../domain/ubicacionGeografica/dtos/updateUbicacionGeografica.dto.js";

export default class UpdateUbicacionGeograficaUseCase {
  constructor(ubicacionGeograficaRepository) {
    this.ubicacionGeograficaRepository = ubicacionGeograficaRepository;
  }

  async execute(id, data) {
    const dto = new UpdateUbicacionGeograficaDTO(data);
    dto.validate();

    const existing = await this.ubicacionGeograficaRepository.findById(id);
    if (!existing) {
      throw new Error("Ubicación geográfica no encontrada");
    }

    return await this.ubicacionGeograficaRepository.update(id, data);
  }
}