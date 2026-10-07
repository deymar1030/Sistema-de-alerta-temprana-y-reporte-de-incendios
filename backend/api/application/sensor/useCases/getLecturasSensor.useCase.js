import { GetSensorDTO } from "../../../domain/sensor/dtos/getSensor.dto.js";

export default class GetLecturasSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(id, filters) {
    const errors = GetSensorDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const sensor = await this.sensorRepository.findById(id);
    if (!sensor) {
      throw new Error("Sensor not found");
    }

    return await this.sensorRepository.findLecturas(id, filters);
  }
}
