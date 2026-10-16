export class SensorService {
  constructor({
    createSensorUseCase,
    getAllSensorUseCase,
    getSensorUseCase,
    getLecturasSensorUseCase,
    updateSensorUseCase,
    deleteSensorUseCase,
  }) {
    this.createSensorUseCase = createSensorUseCase;
    this.getAllSensorUseCase = getAllSensorUseCase;
    this.getSensorUseCase = getSensorUseCase;
    this.getLecturasSensorUseCase = getLecturasSensorUseCase;
    this.updateSensorUseCase = updateSensorUseCase;
    this.deleteSensorUseCase = deleteSensorUseCase;
  }

  async create(sensorData) {
    return await this.createSensorUseCase.execute(sensorData);
  }

  async getAll(filters) {
    return await this.getAllSensorUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getSensorUseCase.execute(id);
  }

  async getLecturas(id, filters) {
    return await this.getLecturasSensorUseCase.execute(id, filters);
  }

  async update(id, sensorData) {
    return await this.updateSensorUseCase.execute(id, sensorData);
  }

  async delete(id) {
    return await this.deleteSensorUseCase.execute(id);
  }
}
