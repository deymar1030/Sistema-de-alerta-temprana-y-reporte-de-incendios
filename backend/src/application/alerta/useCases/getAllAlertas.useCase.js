import { FilterAlertaDTO } from "../../../domain/alerta/dtos/filterAlerta.dto.js";

export default class GetAllAlertasUseCase {
  constructor(alertaRepository) {
    this.alertaRepository = alertaRepository;
  }

  async execute(filters = {}) {
    const errors = FilterAlertaDTO.validate(filters);

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const filterDTO = new FilterAlertaDTO(filters);

    return await this.alertaRepository.findAll(filterDTO);
  }
}