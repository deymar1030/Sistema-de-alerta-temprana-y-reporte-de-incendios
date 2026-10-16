import { CreateReporteUDTO } from "../../../domain/reporteU/dtos/createReporteU.dto.js";
import { ReporteUEntity } from "../../../domain/reporteU/entities/reporteU.entity.js";

export default class CreateReporteUUseCase {
  constructor(reporteURepository) {
    this.reporteURepository = reporteURepository;
  }

  async execute(reporteUData) {
    const errors = CreateReporteUDTO.validate(reporteUData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const reporteUDTO = new CreateReporteUDTO(reporteUData);

    const reporteUEntity = new ReporteUEntity({
      id_reporte_u: null,
      estado: "RECIBIDO",
      fecha_envio: null,
      ...reporteUDTO,
    });

    return await this.reporteURepository.create(reporteUEntity);
  }
}
