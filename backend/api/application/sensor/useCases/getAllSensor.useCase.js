export default class GetAllSensorUseCase {
  constructor(sensorRepository) {
    this.sensorRepository = sensorRepository;
  }

  async execute(filters) {
    return await this.sensorRepository.findAll(filters);
  }
}
