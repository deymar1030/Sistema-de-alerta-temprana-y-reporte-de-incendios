export class InstitucionService {
  constructor({
    createInstitucionUseCase,
    getAllInstitucionUseCase,
    getInstitucionUseCase,
    updateInstitucionUseCase,
    deleteInstitucionUseCase,
  }) {
    this.createInstitucionUseCase = createInstitucionUseCase;
    this.getAllInstitucionUseCase = getAllInstitucionUseCase;
    this.getInstitucionUseCase = getInstitucionUseCase;
    this.updateInstitucionUseCase = updateInstitucionUseCase;
    this.deleteInstitucionUseCase = deleteInstitucionUseCase;
  }

  async create(institucionData) {
    return await this.createInstitucionUseCase.execute(institucionData);
  }

  async getAll() {
    return await this.getAllInstitucionUseCase.execute();
  }

  async getById(id) {
    return await this.getInstitucionUseCase.execute(id);
  }

  async update(id, institucionData) {
    return await this.updateInstitucionUseCase.execute(id, institucionData);
  }

  async delete(id) {
    return await this.deleteInstitucionUseCase.execute(id);
  }
}