import { ResponseInformeAtencionDTO } from "../dtos/responseInformeAtencion.dto.js";

export class InformeAtencionMapper {
  static toResponseDTO(informe) {
    return ResponseInformeAtencionDTO.fromEntity(informe);
  }

  static toResponseDTOArray(informes) {
    return informes.map((informe) => ResponseInformeAtencionDTO.fromEntity(informe));
  }
}
