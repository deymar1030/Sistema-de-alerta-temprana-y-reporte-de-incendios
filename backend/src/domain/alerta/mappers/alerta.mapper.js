import { ResponseAlertaDTO } from "../dtos/responseAlerta.dto.js";
import { ResponseEnvioDTO } from "../dtos/responseEnvio.dto.js";

export class AlertaMapper {
  static toResponseDTO(alertaEntity) {
    return ResponseAlertaDTO.fromEntity(alertaEntity);
  }

  static toResponseDTOArray(alertaEntities) {
    return alertaEntities.map((entity) => this.toResponseDTO(entity));
  }

  static envioToResponseDTO(envioEntity) {
    return ResponseEnvioDTO.fromEntity(envioEntity);
  }
}