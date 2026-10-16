import { ResponseSensorDTO } from "../dtos/responseSensor.dto.js";

export class SensorMapper {
  static toResponseDTO(sensorEntity, ultima_lectura = undefined, predio = undefined) {
    return ResponseSensorDTO.fromEntity(sensorEntity, ultima_lectura, predio);
  }

  static toResponseDTOArray(sensorEntities) {
    return sensorEntities.map((entity) => this.toResponseDTO(entity));
  }
}
