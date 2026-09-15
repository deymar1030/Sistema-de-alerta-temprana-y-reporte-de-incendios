import { ResponseUbicacionGeograficaDTO } from "../dtos/responseUbicacionGeografica.dto.js";

export class UbicacionGeograficaMapper {
  static toResponseDTO(entity) {
    if (!entity) return null;

    return new ResponseUbicacionGeograficaDTO({
      id_ubic_geo: entity.id_ubic_geo ?? null,
      id_zona: entity.id_zona ?? null,
      id_motordet: entity.id_motordet ?? null,
      latitud: entity.latitud != null ? parseFloat(entity.latitud) : null,
      longitud: entity.longitud != null ? parseFloat(entity.longitud) : null,
      altitud: entity.altitud != null ? parseFloat(entity.altitud) : null,
      poligono_geografico: entity.poligono_geografico ?? null,
    });
  }

  static toResponseDTOArray(entities) {
    if (!Array.isArray(entities)) return [];
    return entities.map((e) => UbicacionGeograficaMapper.toResponseDTO(e));
  }
}