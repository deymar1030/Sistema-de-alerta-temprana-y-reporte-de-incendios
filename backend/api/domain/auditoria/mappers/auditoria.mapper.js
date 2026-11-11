import { ResponseAuditoriaDTO } from "../dtos/responseAuditoria.dto.js";
import { ResponseAuditoriaUDTO } from "../dtos/responseAuditoriaU.dto.js";

export class AuditoriaMapper {
  static toResponseDTOArray(filas) {
    return filas.map((fila) => ResponseAuditoriaDTO.fromEntity(fila));
  }

  static toResponseUDTOArray(filas) {
    return filas.map((fila) => ResponseAuditoriaUDTO.fromEntity(fila));
  }
}
