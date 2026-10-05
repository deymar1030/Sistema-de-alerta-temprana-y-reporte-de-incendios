export class UsuarioService {
  constructor({
    createUsuarioUseCase,
    getAllUsuarioUseCase,
    getUsuarioUseCase,
    updateUsuarioUseCase,
    deleteUsuarioUseCase,
  }) {
    this.createUsuarioUseCase = createUsuarioUseCase;
    this.getAllUsuarioUseCase = getAllUsuarioUseCase;
    this.getUsuarioUseCase = getUsuarioUseCase;
    this.updateUsuarioUseCase = updateUsuarioUseCase;
    this.deleteUsuarioUseCase = deleteUsuarioUseCase;
  }

  async create(usuarioData) {
    return await this.createUsuarioUseCase.execute(usuarioData);
  }

  async getAll() {
    return await this.getAllUsuarioUseCase.execute();
  }

  async getById(id) {
    return await this.getUsuarioUseCase.execute(id);
  }

  async update(id, usuarioData) {
    return await this.updateUsuarioUseCase.execute(id, usuarioData);
  }

  async delete(id) {
    return await this.deleteUsuarioUseCase.execute(id);
  }
}
