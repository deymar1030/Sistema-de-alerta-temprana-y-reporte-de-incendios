import { GetPredioDTO } from "../../../domain/predio/dtos/getPredio.dto.js";

export default class GetPredioUseCase {
  constructor(predioRepository) {
    this.predioRepository = predioRepository;
  }

  async execute(id) {
    const errors = GetPredioDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const predio = await this.predioRepository.findById(id);
    if (!predio) {
      throw new Error("Predio not found");
    }

    const sensores = await this.predioRepository.findSensores(id);

    return { predio, sensores };
  }
}
