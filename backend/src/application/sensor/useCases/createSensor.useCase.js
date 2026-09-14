import { CreateSensorDTO } from "../../../domain/sensor/dtos/createSensor.dto.js";

export class CreateSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(data) {
    const validatedData = CreateSensorDTO.validate(data);
    return await this.sensorRepository.create(validatedData);
  }
}