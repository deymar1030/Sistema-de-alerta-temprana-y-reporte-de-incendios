import { CreateUbicacionGeograficaDTO } from "../../../domain/ubicacionGeografica/dtos/createUbicacionGeografica.dto.js";
import { UbicacionGeograficaEntity } from "../../../domain/ubicacionGeografica/entities/ubicacionGeografica.entity.js";

export default class CreateUbicacionGeograficaUseCase {
  constructor(ubicacionGeograficaRepository) {
    this.ubicacionGeograficaRepository = ubicacionGeograficaRepository;
  }

  async execute(data) {
    const dto = new CreateUbicacionGeograficaDTO(data);
    dto.validate();

    const entity = new UbicacionGeograficaEntity(dto);
    return await this.ubicacionGeograficaRepository.create(entity);
  }
}