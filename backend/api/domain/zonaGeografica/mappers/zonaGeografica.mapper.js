import { ResponseZonaGeograficaDTO } from "../dtos/responseZonaGeografica.dto.js";

export class ZonaGeograficaMapper {
  static toResponseDTO(zonaGeograficaEntity) {
    return ResponseZonaGeograficaDTO.fromEntity(zonaGeograficaEntity);
  }

  static toResponseDTOArray(zonaGeograficaEntities) {
    return zonaGeograficaEntities.map((entity) => this.toResponseDTO(entity));
  }
}
