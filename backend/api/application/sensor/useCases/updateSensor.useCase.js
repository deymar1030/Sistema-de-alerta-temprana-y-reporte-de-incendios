import { UpdateSensorDTO } from "../../../domain/sensor/dtos/updateSensor.dto.js";

export default class UpdateSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(id, sensorData) {
    const errors = UpdateSensorDTO.validate(id, sensorData);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existente = await this.sensorRepository.findById(id);
    if (!existente) {
      throw new Error("Sensor not found");
    }

    const sensorDTO = new UpdateSensorDTO(sensorData);

    return await this.sensorRepository.update(id, sensorDTO);
  }
}
