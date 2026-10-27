import { VincularAlertaReporteUDTO } from "../../../domain/reporteU/dtos/vincularAlertaReporteU.dto.js";

export default class VincularAlertaReporteUUseCase {
  constructor(reporteURepository) {
    this.reporteURepository = reporteURepository;
  }

  async execute(id, data) {
    const errors = VincularAlertaReporteUDTO.validate(id, data);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existing = await this.reporteURepository.findById(id);
    if (!existing) {
      throw new Error("Reporte de usuario not found");
    }

    const { id_alerta } = new VincularAlertaReporteUDTO(data);

    return await this.reporteURepository.vincularAlerta(id, id_alerta);
  }
}
