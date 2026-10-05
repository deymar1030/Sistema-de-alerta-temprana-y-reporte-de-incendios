export class ZonaGeograficaService {
  constructor({
    createZonaGeograficaUseCase,
    getAllZonaGeograficaUseCase,
    getZonaGeograficaUseCase,
    updateZonaGeograficaUseCase,
    deleteZonaGeograficaUseCase,
  }) {
    this.createZonaGeograficaUseCase = createZonaGeograficaUseCase;
    this.getAllZonaGeograficaUseCase = getAllZonaGeograficaUseCase;
    this.getZonaGeograficaUseCase = getZonaGeograficaUseCase;
    this.updateZonaGeograficaUseCase = updateZonaGeograficaUseCase;
    this.deleteZonaGeograficaUseCase = deleteZonaGeograficaUseCase;
  }

  async create(zonaGeograficaData) {
    return await this.createZonaGeograficaUseCase.execute(zonaGeograficaData);
  }

  async getAll() {
    return await this.getAllZonaGeograficaUseCase.execute();
  }

  async getById(id) {
    return await this.getZonaGeograficaUseCase.execute(id);
  }

  async update(id, zonaGeograficaData) {
    return await this.updateZonaGeograficaUseCase.execute(id, zonaGeograficaData);
  }

  async delete(id) {
    return await this.deleteZonaGeograficaUseCase.execute(id);
  }
}
