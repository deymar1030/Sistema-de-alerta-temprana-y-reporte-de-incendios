import { GetSensorDTO } from "../../../domain/sensor/dtos/getSensor.dto.js";

export default class GetSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(id) {
    const errors = GetSensorDTO.validate(id);
    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(", ")}`);
    }

    const sensor = await this.sensorRepository.findById(id);
    if (!sensor) {
      throw new Error("Sensor not found");
    }

    const ultima_lectura = await this.sensorRepository.findUltimaLectura(id);
    const predio = await this.sensorRepository.findPredio(sensor.id_predio);

    return { sensor, ultima_lectura, predio };
  }
}
