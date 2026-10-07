import { CreateSensorDTO } from "../../../domain/sensor/dtos/createSensor.dto.js";
import { SensorEntity } from "../../../domain/sensor/entities/sensor.entity.js";

export default class CreateSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(sensorData) {
    const errors = CreateSensorDTO.validate(sensorData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const sensorDTO = new CreateSensorDTO(sensorData);

    const sensorEntity = new SensorEntity({
      id_sensor: null,
      ...sensorDTO,
    });

    return await this.sensorRepository.create(sensorEntity);
  }
}
