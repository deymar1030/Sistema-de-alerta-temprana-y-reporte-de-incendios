export class PredioService {
  constructor({
    createPredioUseCase,
    getAllPredioUseCase,
    getPredioUseCase,
    getMapaPredioUseCase,
    updatePredioUseCase,
    deletePredioUseCase,
  }) {
    this.createPredioUseCase = createPredioUseCase;
    this.getAllPredioUseCase = getAllPredioUseCase;
    this.getPredioUseCase = getPredioUseCase;
    this.getMapaPredioUseCase = getMapaPredioUseCase;
    this.updatePredioUseCase = updatePredioUseCase;
    this.deletePredioUseCase = deletePredioUseCase;
  }

  async create(predioData) {
    return await this.createPredioUseCase.execute(predioData);
  }

  async getAll(filters) {
    return await this.getAllPredioUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getPredioUseCase.execute(id);
  }

  async getMapa() {
    return await this.getMapaPredioUseCase.execute();
  }

  async update(id, predioData) {
    return await this.updatePredioUseCase.execute(id, predioData);
  }

  async delete(id) {
    return await this.deletePredioUseCase.execute(id);
  }
}
