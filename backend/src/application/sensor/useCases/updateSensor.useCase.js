import { UpdateSensorDTO } from "../../../domain/sensor/dtos/updateSensor.dto.js";

export class UpdateSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(id, data) {
    const validatedData = UpdateSensorDTO.validate(id, data);
    return await this.sensorRepository.update(id, validatedData);
  }
}