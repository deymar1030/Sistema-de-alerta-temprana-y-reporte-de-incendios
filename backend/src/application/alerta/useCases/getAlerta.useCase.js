import { GetAlertaDTO } from "../../../domain/alerta/dtos/getAlerta.dto.js";

export default class GetAlertaUseCase {
  constructor(alertaRepository) {
    this.alertaRepository = alertaRepository;
  }

  async execute(id) {
    const errors = GetAlertaDTO.validate(id);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const alerta = await this.alertaRepository.findById(id);

    if (!alerta) {
      throw new Error("Alerta not found");
    }

    return alerta;
  }
}