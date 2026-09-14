import { DeleteSensorDTO } from "../../../domain/sensor/dtos/deleteSensor.dto.js";

export class DeleteSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(id) {
    const validatedId = DeleteSensorDTO.validate(id);
    return await this.sensorRepository.delete(validatedId);
  }
}