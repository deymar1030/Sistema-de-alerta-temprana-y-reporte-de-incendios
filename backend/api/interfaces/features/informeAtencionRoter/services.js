export class InformeAtencionService {
  constructor({ createInformeAtencionUseCase, getAllInformeAtencionUseCase, getInformeAtencionUseCase, updateInformeAtencionUseCase }) {
    this.createInformeAtencionUseCase = createInformeAtencionUseCase;
    this.getAllInformeAtencionUseCase = getAllInformeAtencionUseCase;
    this.getInformeAtencionUseCase = getInformeAtencionUseCase;
    this.updateInformeAtencionUseCase = updateInformeAtencionUseCase;
  }

  async create(informeData) {
    return await this.createInformeAtencionUseCase.execute(informeData);
  }

  async getAll(filters) {
    return await this.getAllInformeAtencionUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getInformeAtencionUseCase.execute(id);
  }

  async update(id, informeData) {
    return await this.updateInformeAtencionUseCase.execute(id, informeData);
  }
}
