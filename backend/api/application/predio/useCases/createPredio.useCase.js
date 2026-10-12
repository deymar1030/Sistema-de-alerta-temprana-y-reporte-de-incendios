import { CreatePredioDTO } from "../../../domain/predio/dtos/createPredio.dto.js";
import { PredioEntity } from "../../../domain/predio/entities/predio.entity.js";
import { calcularIrp } from "../../../domain/predio/calcularIrp.js";
import { Hash } from "../../../config/hash.js";

export default class CreatePredioUseCase {
  constructor(predioRepository) {
    this.predioRepository = predioRepository;
  }

  async execute(predioData) {
    const errors = CreatePredioDTO.validate(predioData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const predioDTO = new CreatePredioDTO(predioData);

    const irp = calcularIrp(predioDTO);
    const contrasena_mqtt = await Hash.hash(predioDTO.contrasena_mqtt);

    const predioEntity = new PredioEntity({
      id_predio: null,
      ...predioDTO,
      contrasena_mqtt,
      irp,
    });

    return await this.predioRepository.create(predioEntity);
  }
}
