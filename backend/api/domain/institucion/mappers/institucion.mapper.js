import { ResponseInstitucionDTO } from "../dtos/responseInstitucion.dto.js";

export class InstitucionMapper {
  static toResponseDTO(institucionEntity) {
    return ResponseInstitucionDTO.fromEntity(institucionEntity);
  }

  static toResponseDTOArray(institucionEntities) {
    return institucionEntities.map((entity) => this.toResponseDTO(entity));
  }
}