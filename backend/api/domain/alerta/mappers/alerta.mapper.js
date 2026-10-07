import { ResponseAlertaDTO, ResponseAlertaDetalleDTO } from "../dtos/responseAlerta.dto.js";

export class AlertaMapper {
  static toResponseDTO(alerta) {
    return ResponseAlertaDTO.fromEntity(alerta);
  }

  static toResponseDTOArray(alertas) {
    return alertas.map((alerta) => ResponseAlertaDTO.fromEntity(alerta));
  }

  static toDetalleDTO(alerta, relaciones) {
    return ResponseAlertaDetalleDTO.fromEntity(alerta, relaciones);
  }
}
