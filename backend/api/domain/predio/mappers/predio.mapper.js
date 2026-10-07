import { ResponsePredioDTO, ResponsePredioMapaDTO } from "../dtos/responsePredio.dto.js";

export class PredioMapper {
  static toResponseDTO(predioEntity, sensores = undefined) {
    return ResponsePredioDTO.fromEntity(predioEntity, sensores);
  }

  static toResponseDTOArray(predioEntities) {
    return predioEntities.map((entity) => this.toResponseDTO(entity));
  }

  static toMapaDTO(predioEntity) {
    return ResponsePredioMapaDTO.fromEntity(predioEntity);
  }

  static toMapaDTOArray(predioEntities) {
    return predioEntities.map((entity) => this.toMapaDTO(entity));
  }
}
