import { GetUbicacionGeograficaDTO } from "../../../domain/ubicacionGeografica/dtos/getUbicacionGeografica.dto.js";

export default class GetUbicacionGeograficaUseCase {
  constructor(ubicacionGeograficaRepository) {
    this.ubicacionGeograficaRepository = ubicacionGeograficaRepository;
  }

  async execute(id) {
    const dto = new GetUbicacionGeograficaDTO({ id_ubic_geo: id });
    dto.validate();

    const found = await this.ubicacionGeograficaRepository.findById(dto.id_ubic_geo);

    if (!found) {
      throw new Error("Ubicación geográfica no encontrada");
    }

    return found;
  }
}