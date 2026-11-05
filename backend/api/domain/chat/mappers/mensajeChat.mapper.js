import { ResponseMensajeChatDTO } from "../dtos/responseMensajeChat.dto.js";

export class MensajeChatMapper {
  static toResponseDTO(mensajeEntity) {
    return ResponseMensajeChatDTO.fromEntity(mensajeEntity);
  }

  static toResponseDTOArray(mensajeEntities) {
    return mensajeEntities.map((entity) => this.toResponseDTO(entity));
  }
}
