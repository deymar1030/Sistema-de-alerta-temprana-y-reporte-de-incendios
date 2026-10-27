export class UsuarioService {
  constructor({
    createUsuarioUseCase,
    getAllUsuarioUseCase,
    getUsuarioUseCase,
    updateUsuarioUseCase,
    desactivarUsuarioUseCase,
    reactivarUsuarioUseCase,
    getOperativosInstitucionUseCase,
  }) {
    this.createUsuarioUseCase = createUsuarioUseCase;
    this.getAllUsuarioUseCase = getAllUsuarioUseCase;
    this.getUsuarioUseCase = getUsuarioUseCase;
    this.updateUsuarioUseCase = updateUsuarioUseCase;
    this.desactivarUsuarioUseCase = desactivarUsuarioUseCase;
    this.reactivarUsuarioUseCase = reactivarUsuarioUseCase;
    this.getOperativosInstitucionUseCase = getOperativosInstitucionUseCase;
  }

  async create(usuarioData) {
    return await this.createUsuarioUseCase.execute(usuarioData);
  }

  async getAll(filters) {
    return await this.getAllUsuarioUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getUsuarioUseCase.execute(id);
  }

  async update(id, usuarioData) {
    return await this.updateUsuarioUseCase.execute(id, usuarioData);
  }

  async desactivar(id) {
    return await this.desactivarUsuarioUseCase.execute(id);
  }

  async reactivar(id) {
    return await this.reactivarUsuarioUseCase.execute(id);
  }

  async getOperativosInstitucion(id_institucion) {
    return await this.getOperativosInstitucionUseCase.execute(id_institucion);
  }
}
