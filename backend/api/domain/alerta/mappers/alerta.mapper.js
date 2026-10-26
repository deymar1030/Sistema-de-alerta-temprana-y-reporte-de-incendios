import { ResponseAlertaDTO, ResponseAlertaDetalleDTO, ResponseAlertaMapaDTO } from "../dtos/responseAlerta.dto.js";

export class AlertaMapper {
  static toResponseDTO(alerta) {
    return ResponseAlertaDTO.fromEntity(alerta);
  }

  static toResponseDTOArray(alertas) {
    return alertas.map((alerta) => ResponseAlertaDTO.fromEntity(alerta));
  }

  static toMapaDTO(alerta) {
    return ResponseAlertaMapaDTO.fromEntity(alerta);
  }

  static toMapaDTOArray(alertas) {
    return alertas.map((alerta) => ResponseAlertaMapaDTO.fromEntity(alerta));
  }

  static toDetalleDTO(alerta, relaciones) {
    return ResponseAlertaDetalleDTO.fromEntity(alerta, relaciones);
  }
}
