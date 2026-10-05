import { ResponseNotificacionDTO } from "../dtos/responseNotificacion.dto.js";

export class NotificacionMapper {
  static toResponseDTO(notificacionEntity) {
    return ResponseNotificacionDTO.fromEntity(notificacionEntity);
  }

  static toResponseDTOArray(notificacionEntities) {
    return notificacionEntities.map((entity) => this.toResponseDTO(entity));
  }
}
