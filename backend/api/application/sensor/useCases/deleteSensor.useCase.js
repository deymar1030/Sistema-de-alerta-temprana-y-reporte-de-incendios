import { GetSensorDTO } from "../../../domain/sensor/dtos/getSensor.dto.js";
import { relanzarErrorEliminacion } from "../../../config/prismaErrors.js";

export default class DeleteSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(id) {
    const errors = GetSensorDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const existente = await this.sensorRepository.findById(id);
    if (!existente) {
      throw new Error("Sensor not found");
    }

    try {
      return await this.sensorRepository.delete(id);
    } catch (error) {
      relanzarErrorEliminacion(error, "el sensor");
    }
  }
}
