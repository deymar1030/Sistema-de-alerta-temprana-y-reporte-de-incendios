import { ResponseSesionDTO } from "../dtos/responseSesion.dto.js";

export class SesionMapper {
  static toResponseDTOArray(sesiones, idSesionActual) {
    return sesiones.map((sesion) => ResponseSesionDTO.fromEntity(sesion, idSesionActual));
  }
}
