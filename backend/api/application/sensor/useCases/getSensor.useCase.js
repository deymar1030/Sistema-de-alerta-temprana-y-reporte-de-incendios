import { GetSensorDTO } from "../../../domain/sensor/dtos/getSensor.dto.js";

export class GetSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(id) {
    const validatedId = GetSensorDTO.validate(id);
    const sensor = await this.sensorRepository.findById(validatedId);
    if (!sensor) {
      throw new Error("Sensor no encontrado");
    }
    return sensor;
  }
}