import { ResponseUsuarioDTO } from "../dtos/responseUsuario.dto.js";

export class UsuarioMapper {
  static toResponseDTO(usuarioEntity) {
    return ResponseUsuarioDTO.fromEntity(usuarioEntity);
  }

  static toResponseDTOArray(usuarioEntities) {
    return usuarioEntities.map((entity) => this.toResponseDTO(entity));
  }
}
