import { ResponseMotorDetDTO } from "../dtos/responseMotorDet.dto.js";

export class MotorDetMapper {
  static toResponseDTO(motorDetEntity) {
    return ResponseMotorDetDTO.fromEntity(motorDetEntity);
  }

  static toResponseDTOArray(motorDetEntities) {
    return motorDetEntities.map((entity) => this.toResponseDTO(entity));
  }
}
