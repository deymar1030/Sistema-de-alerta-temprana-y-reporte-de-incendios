import { ResponseLecturaDTO } from "../dtos/responseLectura.dto.js";

export class LecturaMapper {
  static toResponseDTO(lectura) {
    return ResponseLecturaDTO.fromEntity(lectura);
  }

  static toResponseDTOArray(lecturas) {
    return lecturas.map((lectura) => ResponseLecturaDTO.fromEntity(lectura));
  }
}
