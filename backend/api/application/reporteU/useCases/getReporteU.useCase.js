import { GetReporteUDTO } from "../../../domain/reporteU/dtos/getReporteU.dto.js";

export default class GetReporteUUseCase {
  constructor(reporteURepository) {
    this.reporteURepository = reporteURepository;
  }

  async execute(id) {
    const errors = GetReporteUDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const reporteU = await this.reporteURepository.findById(id);
    if (!reporteU) {
      throw new Error("Reporte de usuario not found");
    }

    const alerta_vinculada = await this.reporteURepository.findAlertaVinculada(id);

    return { reporteU, alerta_vinculada };
  }
}
