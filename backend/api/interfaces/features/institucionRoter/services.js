export class InstitucionService {
  constructor({
    createInstitucionUseCase,
    getAllInstitucionUseCase,
    getInstitucionUseCase,
    updateInstitucionUseCase,
    deleteInstitucionUseCase,
    getJurisdiccionesInstitucionUseCase,
    addJurisdiccionInstitucionUseCase,
    removeJurisdiccionInstitucionUseCase,
  }) {
    this.createInstitucionUseCase = createInstitucionUseCase;
    this.getAllInstitucionUseCase = getAllInstitucionUseCase;
    this.getInstitucionUseCase = getInstitucionUseCase;
    this.updateInstitucionUseCase = updateInstitucionUseCase;
    this.deleteInstitucionUseCase = deleteInstitucionUseCase;
    this.getJurisdiccionesInstitucionUseCase = getJurisdiccionesInstitucionUseCase;
    this.addJurisdiccionInstitucionUseCase = addJurisdiccionInstitucionUseCase;
    this.removeJurisdiccionInstitucionUseCase = removeJurisdiccionInstitucionUseCase;
  }

  async create(institucionData) {
    return await this.createInstitucionUseCase.execute(institucionData);
  }

  async getAll(filters) {
    return await this.getAllInstitucionUseCase.execute(filters);
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

  async getJurisdicciones(id) {
    return await this.getJurisdiccionesInstitucionUseCase.execute(id);
  }

  async addJurisdiccion(id, id_zona) {
    return await this.addJurisdiccionInstitucionUseCase.execute(id, id_zona);
  }

  async removeJurisdiccion(id, id_zona) {
    return await this.removeJurisdiccionInstitucionUseCase.execute(id, id_zona);
  }
}
