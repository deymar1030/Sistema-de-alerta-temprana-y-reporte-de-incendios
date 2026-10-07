import { GetPredioDTO } from "../../../domain/predio/dtos/getPredio.dto.js";

export default class DeletePredioUseCase {
  constructor(predioRepository) {
    this.predioRepository = predioRepository;
  }

  async execute(id) {
    const errors = GetPredioDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existente = await this.predioRepository.findById(id);
    if (!existente) {
      throw new Error("Predio not found");
    }

    return await this.predioRepository.delete(id);
  }
}
