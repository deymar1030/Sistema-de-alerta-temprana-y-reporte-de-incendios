import { DeleteUbicacionGeograficaDTO } from "../../../domain/ubicacionGeografica/dtos/deleteUbicacionGeografica.dto.js";

export default class DeleteUbicacionGeograficaUseCase {
  constructor(ubicacionGeograficaRepository) {
    this.ubicacionGeograficaRepository = ubicacionGeograficaRepository;
  }

  async execute(id) {
    const dto = new DeleteUbicacionGeograficaDTO({ id_ubic_geo: id });
    dto.validate();

    const existing = await this.ubicacionGeograficaRepository.findById(dto.id_ubic_geo);
    if (!existing) {
      throw new Error("Ubicación geográfica no encontrada");
    }

    return await this.ubicacionGeograficaRepository.delete(dto.id_ubic_geo);
  }
}