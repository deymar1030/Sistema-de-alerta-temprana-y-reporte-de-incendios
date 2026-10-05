import { UpdateEstadoReporteUDTO } from "../../../domain/reporteU/dtos/updateEstadoReporteU.dto.js";

export default class UpdateEstadoReporteUUseCase {
  constructor(reporteURepository) {
    this.reporteURepository = reporteURepository;
  }

  async execute(id, data) {
    const errors = UpdateEstadoReporteUDTO.validate(id, data);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existing = await this.reporteURepository.findById(id);
    if (!existing) {
      throw new Error("Reporte de usuario not found");
    }

    const { estado } = new UpdateEstadoReporteUDTO(data);

    return await this.reporteURepository.updateEstado(id, estado);
  }
}
