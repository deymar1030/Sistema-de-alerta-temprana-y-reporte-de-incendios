export class InstitucionService {
  constructor({
    createInstitucionUseCase,
    getAllInstitucionUseCase,
    getInstitucionUseCase,
    updateInstitucionUseCase,
    deleteInstitucionUseCase,
    updateDisponibilidadInstitucionUseCase,
  }) {
    this.createInstitucionUseCase = createInstitucionUseCase;
    this.getAllInstitucionUseCase = getAllInstitucionUseCase;
    this.getInstitucionUseCase = getInstitucionUseCase;
    this.updateInstitucionUseCase = updateInstitucionUseCase;
    this.deleteInstitucionUseCase = deleteInstitucionUseCase;
    this.updateDisponibilidadInstitucionUseCase = updateDisponibilidadInstitucionUseCase;
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

  async updateDisponibilidad(id, data, jefe) {
    return await this.updateDisponibilidadInstitucionUseCase.execute(id, data, jefe);
  }
}
