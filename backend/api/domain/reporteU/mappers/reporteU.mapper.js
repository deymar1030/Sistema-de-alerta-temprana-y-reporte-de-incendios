import { ResponseReporteUDTO } from "../dtos/responseReporteU.dto.js";

export class ReporteUMapper {
  static toResponseDTO(reporteUEntity, alerta_vinculada = null) {
    return ResponseReporteUDTO.fromEntity(reporteUEntity, alerta_vinculada);
  }

  static toResponseDTOArray(reporteUEntities) {
    return reporteUEntities.map((entity) => this.toResponseDTO(entity));
  }
}
