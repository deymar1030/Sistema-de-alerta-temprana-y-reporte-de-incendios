export class UbicacionGeograficaService {
  constructor(useCases) {
    this.createUbicacionGeograficaUseCase = useCases.createUbicacionGeograficaUseCase;
    this.getAllUbicacionGeograficaUseCase = useCases.getAllUbicacionGeograficaUseCase;
    this.getUbicacionGeograficaUseCase = useCases.getUbicacionGeograficaUseCase;
    this.updateUbicacionGeograficaUseCase = useCases.updateUbicacionGeograficaUseCase;
    this.deleteUbicacionGeograficaUseCase = useCases.deleteUbicacionGeograficaUseCase;
  }

  async create(data) {
    return await this.createUbicacionGeograficaUseCase.execute(data);
  }

  async getAll() {
    return await this.getAllUbicacionGeograficaUseCase.execute();
  }

  async getById(id) {
    return await this.getUbicacionGeograficaUseCase.execute(id);
  }

  async update(id, data) {
    return await this.updateUbicacionGeograficaUseCase.execute(id, data);
  }

  async delete(id) {
    return await this.deleteUbicacionGeograficaUseCase.execute(id);
  }
}