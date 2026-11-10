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

  async create(usuarioData, id_usuario_actor, ip_origen) {
    return await this.createUsuarioUseCase.execute(usuarioData, id_usuario_actor, ip_origen);
  }

  async getAll(filters) {
    return await this.getAllUsuarioUseCase.execute(filters);
  }

  async getById(id) {
    return await this.getUsuarioUseCase.execute(id);
  }

  async update(id, usuarioData, id_usuario_actor, ip_origen) {
    return await this.updateUsuarioUseCase.execute(id, usuarioData, id_usuario_actor, ip_origen);
  }

  async desactivar(id, id_usuario_actor, ip_origen) {
    return await this.desactivarUsuarioUseCase.execute(id, id_usuario_actor, ip_origen);
  }

  async reactivar(id, id_usuario_actor, ip_origen) {
    return await this.reactivarUsuarioUseCase.execute(id, id_usuario_actor, ip_origen);
  }

  async getOperativosInstitucion(id_institucion) {
    return await this.getOperativosInstitucionUseCase.execute(id_institucion);
  }
}
