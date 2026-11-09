export default class UsuarioRepository {
  async create(usuarioData, id_usuario_actor) {
    throw new Error("Method not implemented");
  }

  async findById(id) {
    throw new Error("Method not implemented");
  }

  async findAll(filters) {
    throw new Error("Method not implemented");
  }

  async findByInstitucionAndRol(id_institucion, nombre_rol) {
    throw new Error("Method not implemented");
  }

  async update(id, usuarioData, id_usuario_actor) {
    throw new Error("Method not implemented");
  }

  async desactivar(id, id_usuario_actor) {
    throw new Error("Method not implemented");
  }

  async reactivar(id, id_usuario_actor) {
    throw new Error("Method not implemented");
  }

  async incrementarIntentosFallidos(id) {
    throw new Error("Method not implemented");
  }

  async resetearIntentos(id) {
    throw new Error("Method not implemented");
  }

  async bloquear(id, bloqueado_hasta) {
    throw new Error("Method not implemented");
  }

  async guardarSecretoMfa(id, mfa_secreto) {
    throw new Error("Method not implemented");
  }

  async habilitarMfa(id) {
    throw new Error("Method not implemented");
  }
}
