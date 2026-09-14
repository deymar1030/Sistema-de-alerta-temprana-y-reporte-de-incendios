export class GetAllSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute() {
    return await this.sensorRepository.findAll();
  }
}