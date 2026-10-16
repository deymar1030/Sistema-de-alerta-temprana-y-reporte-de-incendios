export class LecturaService {
  constructor({ getAllLecturaUseCase, getLecturaUseCase }) {
    this.getAllLecturaUseCase = getAllLecturaUseCase;
    this.getLecturaUseCase = getLecturaUseCase;
  }

  async getAll(filters) {
    return await this.getAllLecturaUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getLecturaUseCase.execute(id);
  }
}
